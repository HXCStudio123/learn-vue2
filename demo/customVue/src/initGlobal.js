import Watcher from "./observe/watcher.js";
import { mergeOptions, nextTick } from "./utils/index.js";

export function initGlobal(Vue) {
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
