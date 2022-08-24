import { patch } from "./vdom/patch";

export function mountComponent(vm, el) {
  vm.$el = el;
  vm._update(vm._render());
}

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    const vm = this;
    // const preVnode = vm._vnode;
    // vm._vnode = vnode;
    // console.log("入参", vnode, vm.$el);
    // if (!preVnode) {
    //   // 没有前置节点，表示是初始化DOM
    //   vm.$el = patch(vm.$el, vnode);
    // } else {
    //   // 更新DOM
    //   vm.$el = patch(vm.$el, vnode);
    // }
    console.log(vnode)
    patch(vm.$el, vnode);
  };
}

export function callHook(vm, hook) {
  console.log("hook");
}
