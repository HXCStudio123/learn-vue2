(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('console')) :
  typeof define === 'function' && define.amd ? define(['console'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  function genProps(props) {
    let code = "";
    props.forEach((prop) => {
      code += `,${prop.name}:${JSON.stringify(prop.value)}`;
    });
    return `{${code.slice(1)}}`;
  }
  function genText(text) {
    if (defaultTagRE.test(text)) {
      // {{}} 特殊处理
      let tokens = [];
      let match;
      let index = 0;
      let lastIndex = (defaultTagRE.lastIndex = 0);
      while ((match = defaultTagRE.exec(text))) {
        index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push(`_s(${match[1]})`);
        lastIndex = index + match[0].length;
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      return `_v(${tokens.join("+")})`;
    } else {
      return `_v(${JSON.stringify(text)})`;
    }
  }
  function genChildren(children) {
    let code = "";
    children.forEach((child) => {
      code += "," + genElement(child);
    });
    return code.slice(1);
  }
  function genElement(ast) {
    if (ast.type === 2) {
      return genText(ast.text);
    }
    // _c("div", {id: "app"}, _c("span", null, _v(_s(msg) + "test"))
    let code = `_v("${ast.tag}", ${ast.attrs.length ? genProps(ast.attrs) : null},${ast.children.length ? genChildren(ast.children) : null})`;
    return code;
  }

  function generate(ast) {
    let code = genElement(ast);
    code = `with(this) { return ${code}}`;
    const render = new Function(code);
    return {
      render
    };
  }

  // 属性匹配：《 v-bind:test="msg" 》
  // id="app"
  const attribute =
    /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
  // 匹配开始的标签<div
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 判断是否为开始标签的开头 <
  // 匹配开始的结束标签>
  const startTagClose = /^\s*(\/?)>/; // 判断是否为开始标签的结尾 >
  // 匹配关闭标签 </div>
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 判断是否为闭标签， </xxx>
  /**
   * <div id="app">
        text
        <span>{{msg}}</span>
        <span>{{msg}}</span>
      </div>
    1. 确定组装的节点数据
    2. 组装结构

    词法分析：把语言拆成语义上不可分割的最小单元，及token
    语法分析：将词法分析获取的token组装

   * @param {*} html 
   */
  function parseHTML(html) {
    // 堆栈推入，匹配开始关闭
    let stack = [];
    let root = null;
    let currentParent = null;
    while (html) {
      let textEnd = html.indexOf("<");
      if (textEnd === 0) {
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          end(endTagMatch.tagName);
          advance(endTagMatch[0].length);
          continue;
        }
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue;
        }
      }
      if (textEnd > 0) {
        const text = html.substring(0, textEnd);
        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }
    return root;

    function advance(index) {
      html = html.substring(index);
    }
    function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
        // 开始标签
        const match = {
          tagName: start[1], // 标签名
          attrs: [], // 属性
        };
        advance(start[0].length);
        let end, attr;
        while (
          !(end = html.match(startTagClose)) &&
          (attr = html.match(attribute))
        ) {
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5],
          });
          advance(attr[0].length);
        }
        if (end) {
          advance(end[0].length);
        }
        return match;
      }
      return false;
    }
    function start(tag, attrs) {
      const node = createASTElement(tag, attrs);
      if (!root) {
        root = node;
      }
      if (currentParent) {
        currentParent.children.push(node);
      }
      stack.push(node);
      currentParent = node;
    }
    function chars(text) {
      text = text.replace(/\s/g, "");
      if (text) {
        currentParent.children.push({
          type: 2,
          text,
          parent: currentParent
        });
      }
    }
    function end(tag) {
      stack.pop();
      if (stack.length) {
        currentParent = stack[stack.length - 1];
      }
    }
  }

  // 创建Ast标签节点
  function createASTElement(tag, attrs) {
    return {
      tag,
      attrs,
      tyep: 1,
      children: [],
      parent: null,
    };
  }

  /**
   * 模板引擎，
   * 1. 解析html，生成ast语法树
   * 2. 根据ast语法树生成render函数
   * 3. render函数将
   * @param {String} html
   */
  function compileToFunctions(html) {
    const ast = parseHTML(html);
    // 根据ast生成render函数
    /**
     * <div id="app">
        text
        <span>{{msg}}</span>
      </div>

      ast树

      render(h) {
        return h('div', [{id: "app"], h('span', null, null)}])
      }
      _c("div", {id: "app"}, _c("span", null, _v(_s(msg) + "test"))
     */
    const { render } = generate(ast);
    return render;
  }

  function mountComponent(vm, el) {
    // render -> 虚拟DOM
    // _render 执行后得到虚拟DOM
    // _update(虚拟DOM) -> 真实DOM
    // 虚拟DOM -> 生成真实DOM
    vm._update(vm._render());
  }

  function initLifecycle(Vue) {
    Vue.prototype._update = function () {
      console.log("update");
    };
    
  }

  class Observer {
    constructor(data) {
      // TODO 数组劫持区分
      this.walk(data);
    }
    walk(data) {
      Object.keys(data).forEach((key) => defineReactive(data, key, data[key]));
    }
  }
  /**
   *
   * @param {*} target 目标对象
   * @param {*} key 需要拦截的键值
   * @param {*} value 当前获取的键值对应的数据
   */
  function defineReactive(target, key, value) {
    // 对象 key {  }
    // 拦截取值的过程
    // 拦截赋值的过程
    observe(value);
    // 只能拦截当前target 存在的 key
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get() {
        console.log("get", value);
        return value;
      },
      set(newValue) {
        if (newValue === value) {
          return;
        }
        console.log("set", newValue);
        observe(newValue);
        value = newValue;
      },
    });
  }

  function observe(data) {
    if (typeof data !== "object" || data === null) {
      return;
    }
    return new Observer(data);
  }

  function initState(vm) {
    const opts = vm.$options;
    if (opts.data) {
      initData(vm);
    }
  }
  /**
   * vm.msg -> vm._data.msg
   * @param {*} target 我要获取目标对象
   * @param {*} sourceKey 这个key值真正存在的位置
   * @param {*} key 需要获得key
   */
  function proxy(target, sourceKey, key) {
    // vm.msg -> vm._data.msg
    // target => vm
    // key => msg
    // sourceKey => _data
    Object.defineProperty(target, key, {
      configurable: true,
      enumerable: true,
      get() {
        return target[sourceKey][key]
      },
      set(newValue) {
        target[sourceKey][key] = newValue;
      }
    });
  }

  function initData(vm) {
    let data = vm.$options.data;
    data = typeof data === "function" ? data.call(vm) : data || {};
    // observe(data)
    // _ $ 
    vm._data = data;
    observe(data);
    // vm.key -> vm._data.key
    Object.keys(data).forEach(key => proxy(vm, '_data', key));
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      console.log(options);
      const vm = this;
      // mergeOptions $ _
      vm.$options = options;
      // data  props method
      initState(vm);
      vm._self = vm;
      if (vm.$options.el) {
        this.$mount(vm.$options.el);
      }
    };
    // template -> js
    // AST语法转换: 抽象
    // html -> ast -> js -> 虚拟DOM
    // runtime-only
    // runtime-with-compiler
    Vue.prototype.$mount = function (el) {
      // 有render用render
      // 没有render看template
      // 没有template用el
      const vm = this;
      el = document.querySelector(el);
      const opts = vm.$options;
      if (!opts.render) {
        let template = opts.template;
        if (!template && el) {
          template = el.outerHTML;
        }
        if (template) {
          // 拿到template后根据当前的template生成render
          const render = compileToFunctions(template);
          opts.render = render;
        }
      }
      console.log(opts.render);
      // 页面的初渲染
      mountComponent(vm);
    };
  }

  function createElement(context, tag, data, parent, ...children) {
    // _v("div", {id:"app"},_v("text"),_v("span", null,_v(_s(msg)+"test"+_s(age)+"34567890")))
    return new VNode(context, tag, data, children, parent, data.key);
  }

  function createTextVNode(context, text) {
    return new VNode(context, tag, data, children, parent, data.key);
  }

  class VNode {
    constructor(context, tag, data, children, parent, key) {
      this.context = context;
      this.tag = tag;
      this.data = data;
      this.children = children;
      this.parent = parent;
      this.key = key || null;
    }
  }

  function initRenders(Vue) {
    Vue.prototype._c = function (...args) {
      return createElement(this, args);
    };
    Vue.prototype._v = function (...args) {
      return createTextVNode(this);
    };
    Vue.prototype._s = function (value) {
      return JSON.stringify(value);
    };
    Vue.prototype._render = function () {
      const vm = this;
      const vnode = vm.$options.render.call(vm);
      console.log("vnode ", vnode);
    };
  }

  function Vue(options) {
    this._init(options);
  }

  initMixin(Vue);
  initRenders(Vue);
  initLifecycle(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
