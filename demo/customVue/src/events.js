import { on } from "events";

export function eventsMixin(Vue) {
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
export function initEvents(vm) {
  vm._events = {};
  vm._hasHookEvent = false;
}
