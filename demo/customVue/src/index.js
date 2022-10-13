import initMixin from "./init";
import { lifecycleMixin } from "./lifecycle";
import { nextTick } from "./observe/watcher";
import { renderMixin } from "./render";

function Vue(options) {
  this._init(options);
}

initMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

Vue.prototype.$nextTick = nextTick
export default Vue;
