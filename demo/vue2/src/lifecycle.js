export function mountComponent(vm, el) {
  // render -> 虚拟DOM
  // _render 执行后得到虚拟DOM
  // _update(虚拟DOM) -> 真实DOM
  // 虚拟DOM -> 生成真实DOM
  vm._update(vm._render());
}

export function initLifecycle(Vue) {
  Vue.prototype._update = function () {
    console.log("update");
  };
}
