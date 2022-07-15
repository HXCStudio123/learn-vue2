import { compileToFunctions } from "./compile/index";
import { mountComponent } from "./lifecycle";
import { initState } from "./state";

export function initMixin(Vue) {
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
    mountComponent(vm, el);
  };
}
