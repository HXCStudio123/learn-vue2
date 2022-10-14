import { eventsMixin } from "./events";
import initMixin from "./init";
import { initGlobal } from "./initGlobal";
import { lifecycleMixin } from "./lifecycle";
import { renderMixin } from "./render";

function Vue(options) {
  this._init(options);
}
initGlobal(Vue);
initMixin(Vue);
eventsMixin(Vue);
lifecycleMixin(Vue);
renderMixin(Vue);

export default Vue;
