import { createElement, createTextVNode } from "./vdom/index";

export function initRenders(Vue) {
  Vue.prototype._c = function (...args) {
    return createElement(this, args);
  };
  Vue.prototype._v = function (...args) {
    return createTextVNode(this, args);
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
