import { createElement, createTextVNode } from "./vdom/index";

export function renderMixin(Vue) {
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