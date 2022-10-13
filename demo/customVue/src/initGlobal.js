import { nextTick } from "./utils/index.js";

export function initGlobal(Vue) {
  Vue.prototype.$nextTick = nextTick;
  Vue.prototype.$watch = function () {}
}
