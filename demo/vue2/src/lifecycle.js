export function mountComponent(vm, el) {
  // render -> 虚拟DOM
  // _render 执行后得到虚拟DOM
  // _update(虚拟DOM) -> 真实DOM
  // 虚拟DOM -> 生成真实DOM
  vm._update(vm._render());
}

export function initLifecycle(Vue) {
  Vue.prototype._update = function (vnode) {
    console.log("update", vnode);
    patch(vnode);
  };
}

// 渲染真实DOM
function patch(vnode) {
  if(vnode) {
    // diff算法
  } else {
    // 初始化
  }
}
