(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('events')) :
  typeof define === 'function' && define.amd ? define(['events'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function eventsMixin(Vue) {
    // 监听事件
    Vue.prototype.$on = function (event, fn) {
      const vm = this;
      if (Array.isArray(event)) {
        event.forEach((ev) => {
          vm.$on(ev, fn);
        });
      } else {
        (vm._events[event] || (vm._events[event] = [])).push(fn);
      }
    };
    // 触发事件
    Vue.prototype.$emit = function (event, ...args) {
      const vm = this;
      const cbs = vm._events[event];
      if (cbs) {
        cbs.forEach((cb) => cb.call(this, ...args));
      }
    };
    // 取消挂载(或取消当前事件中的某一项挂载)，或批量取消挂载
    Vue.prototype.$off = function (event, fn) {
      const vm = this;
      if (Array.isArray(event)) {
        event.forEach((ev) => vm.$off(ev, fn));
        return;
      }
      const cbs = vm._events[event];
      if (!cbs) return;
      if (fn) {
        let i = cbs.length;
        while (i--) {
          if (cbs[i] === fn || cbs[i].fn === fn) {
            cbs.splice(i, 1);
            break;
          }
        }
      } else {
        vm._events[event] = null;
      }
    };
    // 执行一次就取消
    Vue.prototype.$once = function (event, fn) {
      function onceOff(...args) {
        vm.$off(event, onceOff);
        fn.call(this, ...args);
      }
      // 需要再onceOff事件上添加原执行函数，避免取消挂载时找不到到对应的函数变量
      onceOff.fn = fn;
      vm.$on(event, onceOff);
    };
  }
  function initEvents(vm) {
    vm._events = {};
    vm._hasHookEvent = false;
  }

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

  function genProps(props) {
    let code = "";
    props.forEach((attr) => {
      code += `,${attr.name}:${JSON.stringify(attr.value)}`;
    });
    return `{${code.slice(1)}}`;
  }
  function genChildren(children) {
    let code = "";
    children.forEach((child) => {
      code += "," + genElement(child);
    });
    return code.slice(1);
  }

  function genText({ text }) {
    let code;
    if (defaultTagRE.test(text)) {
      // _s(name) + text
      let tokens = [];
      let match;
      let index;
      let lastIndex = (defaultTagRE.lastIndex = 0);
      while ((match = defaultTagRE.exec(text))) {
        // 文本节点处于两次index之间
        index = match.index;
        if (index > lastIndex) {
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        lastIndex = index + match[0].length;
        tokens.push(`_s(${match[1]})`);
      }
      if (lastIndex < text.length) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }
      code = `_v(${tokens.join("+")})`;
    } else {
      code = `_v(${JSON.stringify(text)})`;
    }
    return code;
    // return `_v(${ defaultTagRE.test(node.text) ?  : JSON.stringify(node.text)})`
  }

  /**
   * 生成render函数：_c('div',{id: 'app'}, _c('span', null,  _v(_s(msg))))
   * @param {*} ast
   * @returns
   */
  function genElement(ast) {
    if (ast.type === 2) {
      // 文本节点返回值
      return genText(ast);
    }
    // let code = `_c('div',{id: 'app'}, _c('span', null, _v(_s(msg))))`;
    let code = `_c('${ast.tag}', ${ast.attrs?.length ? genProps(ast.attrs) : null}, ${ast.children?.length ? genChildren(ast.children) : null})`;
    return code;
  }

  function generate (ast) {
    let code = genElement(ast);
    code = `with(this) { return ${code} }`;
    const render = new Function(code);
    // console.log(render)
    return {
      render
    }
  }

  // 属性正则：匹配属性 a = b  a="b" a='b'
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
   * 拆解template 生成ast语法树
   * @param {*} template 模板
   * @returns ast语法树
   */
  function parseHTML(html) {
    // 根节点
    let root = null;
    let currentParent = null;
    // 匹配开始结束的栈
    let stack = [];
    // 处理一个解析一个，直至最后全部处理完成
    while (html) {
      // 获取每一个标签的开始
      let textEnd = html.indexOf("<");
      if (textEnd === 0) {
        /**
         * 有两种情况
         * 1. 表示当前处于标签起始位置并通过起始位置处理当前标签
         * 2. 是关闭标签</div>
         * eg: <div id="app" v-bind="ssss"> <span></span></div>
         * textEnd: 0; 通过处理当前 <div id="app"> ‘<’ 和 ‘>’中间的部分
         */
        // 关闭标签的处理，直接除掉
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue;
        }

        // 开始标签处理
        const startTagMatch = parseStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          // 此时相当于处理完开始标签了
          continue;
        }
      }
      /**
       * 如果<并不是第一个索引，那么表示<div>aaa<span></span></div>
       */
      let text;
      if (textEnd > 0) {
        // 截取文本内容
        text = html.substring(0, textEnd);
        if (text) {
          chars(text);
          advance(text.length);
        }
      }
    }

    return root;

    function parseStartTag() {
      const start = html.match(startTagOpen);
      if (start) {
        // 是开始标签
        const match = {
          tagName: start[1],
          attrs: [],
        };
        // 处理后把当前处理结束的标签去掉
        advance(start[0].length);
        // 此时开始标签已经被移除，因此开始处理属性
        // 在遇到 '>' 前都是当前标签的属性
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
          // 处理关闭标签
          advance(end[0].length);
        }
        return match;
      }
      return false;
    }
    /**
     * 处理html标签
     * @param {number} n
     */
    function advance(n) {
      html = html.substring(n);
    }

    function start(tag, attrs) {
      let element = createASTElement(tag, attrs);
      if (!root) {
        root = element;
      }
      if (currentParent) {
        element.parent = currentParent;
        currentParent.children.push(element);
      }
      stack.push(element);
      currentParent = element;
    }
    function chars(text) {
      text = text.replace(/\s/g, "");
      text &&
        currentParent.children.push({
          text,
          type: 2,
          parent: currentParent,
        });
    }
    function end(tag) {
      stack.pop();
      if (stack.length) {
        currentParent = stack[stack.length - 1];
      }
    }
  }

  function createASTElement(tag, attrs) {
    return {
      tag,
      attrs,
      type: 1,
      children: [],
      parent: null,
    };
  }

  /**
   * 主要做了两个操作
   * 1. 将template 生成ast语法树
   * 2. 生成render函数
   * @param {*} template
   */
  function compileToFunctions(template) {
    // 解析template
    const ast = parseHTML(template);
    // _c('div',{id: 'app'}, _c('span', null, _v(_s(msg) + 'text')))
    const { render } = generate(ast);
    // 生成对应的处理函数
    return render;
  }

  // 采用优雅降级的方式
  let callbacks = [];
  let waiting = false;
  let timeFn = null;

  if (Promise) {
    timeFn = () => {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    let counter = 1;
    const observer = new MutationObserver(flushCallbacks);
    const textNode = document.createTextNode(String(counter));
    observer.observe(textNode, {
      characterData: true,
    });
    timeFn = () => {
      counter = (counter + 1) % 2;
      textNode.data = String(counter);
    };
  } else if (setTimeout) {
    timeFn = () => {
      setTimeout(flushCallbacks, 0);
    };
  } else if (setInterval) {
    timeFn = () => {
      setInterval(flushCallbacks);
    };
  }

  function flushCallbacks() {
    callbacks.forEach((cb) => cb());
    callbacks = [];
    waiting = false;
  }

  /**
   * 确认自定义nextTick和内部渲染的执行顺序，维护了一个执行异步的队列
   * @param {*} cb 回调函数，可能是执行的渲染get 也可能是用户自定义执行的函数
   * @param {*} time
   */
  function nextTick(cb) {
    callbacks.push(cb);
    if (!waiting) {
      waiting = true;
      timeFn();
    }
  }

  const def = function (obj, key, value) {
    Object.defineProperty(obj, key, {
      enumerable: false,
      value,
    });
  };

  /**
   * 从这里可以看出Vue的数值优先级子元素更高
   * @param {*} parent
   * @param {*} child
   * @returns
   */
  function mergeHook(parent, child) {
    let res;
    if (child) {
      if (parent) {
        res = parent.concat(child);
      } else {
        res = [child];
      }
    } else {
      res = parent;
    }
    return res;
  }
  const strats = {};
  const LIFECYCLE_HOOKS = ["beforeCreate", "created"];
  LIFECYCLE_HOOKS.forEach((hook) => {
    strats[hook] = mergeHook;
  });
  function mergeOptions(parent, child) {
    let options = {};
    let key;
    for (key in parent) {
      mergeField(key);
    }
    for (key in child) {
      if (!parent[key]) {
        mergeField(key);
      }
    }
    /**
     * 策略模式合并
     * @param {*} key
     */
    function mergeField(key) {
      const strat = strats[key] || defaultStrat;
      options[key] = strat(parent[key], child[key]);
    }
    return options;
  }
  // 以生命周期为例其他的不处理
  function defaultStrat(parent, child) {
    return child || parent;
  }

  let id$1 = 0;
  /**
   * Dep依赖，其实也是被观察者
   * 对在模板中被使用的（能触发get方法）数据，添加一个收集器
   * 收集器上可以存放，当前引用该数据的视图实例，即Watcher
   */
  class Dep {
    constructor() {
      this.id = id$1++;
      this.subs = [];
      // this.subsId = new Set();
    }
    addSub(sub) {
      this.subs.push(sub);
    }
    // 给watcher添加当前数据绑定，在dep的依赖里加入watcher
    depend() {
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    }
    notify() {
      for (let sub of this.subs) {
        sub.update();
      }
    }
  }

  let id = 0;
  /**
   * 观察者
   */
  class Watcher {
    constructor(vm, expOrFn, options, renderWatcher, cb) {
      this.id = id++;
      this.vm = vm;
      this.cb = cb;
      this.renderWatcher = renderWatcher;
      /**
       * expOrFn 和 cb
       * expOrFn：是自定义获取对应值的表达式（或字符串）
       * cb：是获取触发时的回调函数
       */
      if (typeof expOrFn === "string") {
        this.getter = function () {
          return this[expOrFn];
        };
      } else {
        this.getter = expOrFn;
      }
      this.newDeps = [];
      this.newDepsId = new Set();
      // 懒更新 computed & watch(用户自定义的watch)
      if (options) {
        this.lazy = !!options.lazy;
        this.user = !!options.user;
      }
      this.dirty = this.lazy;
      // watcher初渲染
      this.lazy ? undefined : this.get();
    }
    addDep(dep) {
      // 去重
      if (!this.newDepsId.has(dep.id)) {
        // 建立 watcher -> dep 对应关系
        this.newDeps.push(dep);
        this.newDepsId.add(dep.id);
        // 建立 dep -> watcher 对应关系
        dep.addSub(this);
      }
    }
    excutate() {
      this.dirty = false;
      this.value = this.get();
    }
    get() {
      // debugger;
      const oldValue = this.value;
      pushStack(this);
      this.value = this.getter.call(this.vm);
      popStack();
      if (this.user) {
        this.cb.call(this.vm, this.value, oldValue);
      }
      return this.value;
    }
    update() {
      if (this.lazy) {
        // 有依赖的值发生变化，表示需要获取新值，此时只是更改了获取的computed watcher，不需要视图渲染，此时能拿到新值了
        this.dirty = true;
      } else {
        queueWatcher(this);
      }
      // this.get();
    }
    run() {
      this.get();
    }
    // 给当前watcher添加dep依赖
    depend() {
      for (let dep of this.newDeps) {
        dep.depend();
      }
    }
  }
  Dep.target = null;
  let stack = [];
  function pushStack(watcher) {
    stack.push(watcher);
    Dep.target = watcher;
  }
  function popStack() {
    stack.pop();
    Dep.target = stack[stack.length - 1];
  }

  let queue = [];
  let watcherIds = new Set();
  let pending = false;

  /**
   * 批处理watcher更新
   */
  function flushSchedulerQueue() {
    for (let watcher of queue) {
      watcher.run();
    }
    // 执行后状态初始化
    pending = false;
    queue = [];
    watcherIds = new Set();
  }

  /**
   * 存放watcher更新队列，如果watcher需要更新，那么收集当前需要更新的watcher
   * @param {Watcher} watcher
   */
  function queueWatcher(watcher) {
    // 查看是否有重复的watcher
    if (!watcherIds.has(watcher.id)) {
      // 添加进队列等待统一处理
      queue.push(watcher);
      watcherIds.add(watcher.id);
    }
    if (!pending) {
      pending = true;
      nextTick(flushSchedulerQueue);
    }
  }

  /**
   * 虚拟DOM转真实DOM
   * @param {*} oldVnode
   * @param {*} vnode
   */
  function patch(oldVnode, vnode) {
    if (oldVnode === vnode) {
      return;
    }
    const isRealElement = oldVnode.nodeType;
    if (isRealElement) {
      // 获取真实元素
      const elm = oldVnode;
      const parentElm = elm.parentNode;
      // 拿到父元素
      const newElm = createElm(vnode);
      parentElm.insertBefore(newElm, elm.nextSibling);
      parentElm.removeChild(elm);
      return newElm;
    }
  }

  // 根据vnode创建真实DOM节点
  function createElm(vnode, parentElm) {
    // 初始化
    const { tag, data, children, text } = vnode;
    if (typeof tag === "string") {
      // 创建标签，此时将真实节点和虚拟节点对应起来，为以后diff算法修改对应节点做准备
      vnode.elm = document.createElement(tag);
      if (data) {
        updateProps(vnode.elm, data);
      }
      // 创建子节点
      createChildren(vnode, children);
    } else {
      vnode.elm = document.createTextNode(text);
    }
    insert(parentElm, vnode.elm);
    return vnode.elm;
  }

  function createChildren(vnode, children) {
    if (Array.isArray(children)) {
      for (let item of children) {
        createElm(item, vnode.elm);
      }
    }
  }

  function insert(parent, elm) {
    if (parent) {
      parent.appendChild(elm);
    }
  }

  // 属性值插入
  function updateProps(el, props) {
    for (let key in props) {
      el.setAttribute(key, props[key]);
    }
  }

  function mountComponent(vm, el) {
    vm.$el = el;
    // 初渲染的时候初始化页面
    /**
     * 1. 初始化视图时，获取取的数据，触发数据劫持中的 get方法
     * 2. 此时对dep来说视图已知，即Dep.target
     * 3. 在get触发后，dep通知watcher对象，使其监听列表里添加当前的dep 即dep.denpend() -> Dep.target.addDep(this)
     * 4. watcher被通知后，得知自己有需要添加的对象，此时建立双向的依赖关系
     */
    const updateComponent = () => {
      vm._update(vm._render());
    };
    new Watcher(vm, updateComponent, null, true);
  }

  function lifecycleMixin(Vue) {
    // 渲染真实DOM
    Vue.prototype._update = function (vnode) {
      const vm = this;
      // 新的dom元素赋值给vm，这样可以手动修改当前页面的DOM元素
      vm.$el = patch(vm.$el, vnode);
      // console.log(vm.$el);
    };
  }

  /**
   * callhook 和 事件发布订阅一起
   * @param {*} vm
   * @param {*} hook
   */
  function callHook(vm, hook) {
    // 批量执行hook
    const handlers = vm.$options[hook];
    handlers.forEach(handler => handler.call(vm));
  }

  const oldArrayProto = Array.prototype;

  // newArrayProto.__proto__ = Array.prototype
  let newArrayProto = Object.create(oldArrayProto);

  // 需要重写的是可能会改变当前数组本身的操作
  const methods = [
    "push",
    "pop",
    "shift",
    "unshift",
    "splice",
    "sort",
    "reverse",
  ];

  methods.forEach((method) => {
    newArrayProto[method] = function (...args) {
      let result = oldArrayProto[method].call(this, ...args);
      const ob = this.__ob__;
      // push unshift splice
      let inserted;
      switch (method) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          // splice(0, 2, {name:2}, {name:3})
          inserted = args.slice(2);
          break;
      }
      if (inserted) {
        ob.observeArray(inserted);
      }
      return result;
    };
  });

  class Observer {
    constructor(data) {
      /**
       * object.defineProperty 只能劫持当前存在的属性，对新增的和删除的监听不到
       * 因此在Vue2中需要写一些单独的api 比如 $set $delete
       */
      // 将__ob__变成不可枚举，这样循环的时候就无法枚举当前属性了
      def(data, "__ob__", this);
      // Object.defineProperty(data, "__ob__", {
      //   enumerable: false,
      //   value: this,
      // });
      // data.__ob__ = this;
      if (Array.isArray(data)) {
        data.__proto__ = newArrayProto;
        // data.push() -> 这里的data就是push自定义中的执行上下文（this）
        this.observeArray(data);
      } else {
        this.walk(data);
      }
    }
    walk(obj) {
      // 循环对象对属性进行依次劫持
      // 此处会重新定义属性，相当于把data中的数据重新复制一遍
      Object.keys(obj).forEach((key) => defineReactive(obj, key, obj[key]));
    }
    observeArray(arr) {
      arr.forEach((data) => observe(data));
    }
  }

  /**
   * 把当前的对象定义为响应式(这个方法可以在$set 和 $delete中使用)
   * @param {*} obj 对象
   * @param {*} key 键名
   * @param {*} val 键值
   */
  function defineReactive(obj, key, value) {
    // 对每一个属性都做增加一个dep，用作收集依赖的watcher
    const dep = new Dep();
    // 对所有对象都进行属性劫持
    observe(value);
    Object.defineProperty(obj, key, {
      configurable: true,
      enumerable: true,
      get() {
        // console.log("get", value);
        if (Dep.target) {
          dep.depend();
        }
        return value;
      },
      set(newValue) {
        // 更新value
        if (value === newValue) {
          return;
        }
        // console.log("set", newValue);
        observe(newValue);
        value = newValue;
        dep.notify();
      },
    });
  }

  function observe(data) {
    if (typeof data !== "object" || data === null) {
      return;
    }
    if (data.__ob__ instanceof Observer) {
      return data.__ob__;
    }
    // 添加属性标记，如果一个实例被创建过或者被标记过就不标记直接返回
    return new Observer(data);
  }

  /**
   * 实现数据的代理，可由vm.xxx 代理到 vm._data上
   * @param {*} target 目标对象
   * @param {*} sourceKey 当前key对应真实位置
   * @param {*} key 被查找的key
   */
  function proxy(target, sourceKey, key) {
    // vm[name] -> vm[sourceKey][key]
    Object.defineProperty(target, key, {
      get() {
        return target[sourceKey][key];
      },
      set(newValue) {
        target[sourceKey][key] = newValue;
      },
    });
  }

  function initData(vm) {
    let data = vm.$options.data;
    // data 可能是函数也可能是一个对象
    // 如果是函数希望执行
    // 不是函数直接使用data
    data = typeof data === "function" ? data.call(vm) : data;
    vm._data = data;
    // 响应式实现，对data进行劫持
    observe(data);
    Object.keys(data).forEach((key) => {
      proxy(vm, "_data", key);
    });
  }

  function initState(vm) {
    const opts = vm.$options;
    // 初始化data、props、method等
    if (opts.data) {
      initData(vm);
    }
    if (opts.computed) {
      initComputed(vm, opts.computed);
    }
    if (opts.watch) {
      initWatch(vm, opts.watch);
    }
  }

  function initComputed(vm, computed) {
    let watchers = (vm._computedWatchers = []);
    for (let key in computed) {
      const userDef = computed[key];
      const getter = typeof userDef === "function" ? userDef : userDef.get;
      watchers[key] = new Watcher(vm, getter, { lazy: true }, false);
      defineComputed(vm, key, userDef);
    }
  }

  function defineComputed(target, key, userDef) {
    const setter = typeof userDef === "function" ? () => {} : userDef.set;
    Object.defineProperty(target, key, {
      get: createComputedGetter(target._computedWatchers[key]),
      set: setter,
    });
  }

  function createComputedGetter(watcher) {
    return function () {
      if (watcher.dirty) {
        // 执行计算
        watcher.excutate();
      }
      if (Dep.target) {
        // 将计算属性watcher内的dep，加到当前的渲染watcher上，使dep属性变更时可以同步watcher视图更新
        watcher.depend();
      }
      return watcher.value;
    };
  }

  function initWatch(target, watch) {
    for (let key in watch) {
      createWatcher(target, key, watch[key]);
    }
  }
  function createWatcher(vm, key, cb) {
    vm.$watch(key, cb);
  }

  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      // 在init里面我们可以做一些初始化的操作
      // 在Vue中一般使用 $xxx 来表示一些Vue的私有属性
      // 在Vue源码中，此处其实是做了一个参数合并的动作
      // 将用户的操作挂载在实例上
      // vm.$options = options;
      const globalOptions = Vue.options;
      vm.$options = mergeOptions(globalOptions || {}, options);
      vm._self = vm;
      initEvents(vm);
      callHook(vm, "beforeCreate");
      initState(vm);
      callHook(vm, "created");
      // 初始化状态，比如 data/computed/props等等
      if (vm.$options.el) {
        vm.$mount(vm.$options.el);
      }
    };
    Vue.prototype.$mount = function (el) {
      const vm = this;
      el = document.querySelector(el);
      const opts = vm.$options;
      // 先查找render
      if (!opts.render) {
        let template = opts.template;
        // 如果当前没有render没那就解析template
        if (!template && el) {
          // 有template解析template，没有就解析使用el获取dom元素
          // outerHTML获取序列化后的html片段
          template = el.outerHTML;
        }
        if (template) {
          // 如果有模板需要对模板进行编译，即 html -> ast语法树
          // 生成render函数，并挂载到opts上
          const render = compileToFunctions(template);
          // jsx -> 渲染函数 h('div', { ... 描述 })
          // 这一步骤只有在打包时才会有，runtime Only 如果是runtime+compiler则是把编译过程放在运行时做
          opts.render = render;
        }
      }
      // 开始渲染页面
      mountComponent(vm, el);
    };
  }

  function initGlobal(Vue) {
    Vue.prototype.$nextTick = nextTick;
    /**
     * 监听dep，当dep有变化是更新通知对应的watcher，并执行回调函数
     * @param {*} key
     * @param {*} cb
     * @returns
     */
    Vue.prototype.$watch = function (key, cb) {
      const vm = this;
      new Watcher(vm, key, { user: true }, false, cb);
    };
    Vue.mixin = function (mixin) {
      this.options = mergeOptions(this.options || {}, mixin);
      return this
    };
  }

  function createElement(context, tag, key, data, children) {
    return new VNode(context, tag, 1, key, data, children);
  }
  function createTextVNode(context, text) {
    return new VNode(context, undefined, 2, undefined, undefined, undefined, text);
  }
  class VNode {
    constructor(context, tag, type, key, data, children, text) {
      this.context = context;
      this.tag = tag;
      this.type = type;
      this.key = key;
      this.text = text;
      this.data = data;
      this.children = children;
    }
  }

  function renderMixin(Vue) {
    Vue.prototype._render = function () {
      const vm = this;
      const vnode = vm.$options.render.call(vm);
      return vnode;
    };
    // 创建元素节点
    Vue.prototype._c = function (tag, data, ...children) {
      return createElement(this, tag, data?.key, data, children);
    };
    // 创建文本节点
    Vue.prototype._v = function (text) {
      return createTextVNode(this, text);
    };
    // 字符串变更
    Vue.prototype._s = function (val) {
      // console.log('---', val)
      // return JSON.stringify(val)
      return val
    };
  }

  function Vue(options) {
    this._init(options);
  }
  initGlobal(Vue);
  initMixin(Vue);
  eventsMixin(Vue);
  lifecycleMixin(Vue);
  renderMixin(Vue);

  return Vue;

}));
//# sourceMappingURL=vue.js.map
