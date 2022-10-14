import Watcher from "./observe/watcher";
import { patch } from "./vdom/patch";

export function mountComponent(vm, el) {
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

export function lifecycleMixin(Vue) {
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
export function callHook(vm, hook) {
  // 批量执行hook
  const handlers = vm.$options[hook]
  handlers.forEach(handler => handler.call(vm))
}
