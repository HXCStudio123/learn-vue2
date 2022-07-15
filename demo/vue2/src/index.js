import { initMixin } from "./init"
import { initLifecycle } from "./lifecycle"
import { initRenders } from "./render"

function Vue(options) {
  this._init(options)
}

initMixin(Vue)
initRenders(Vue)
initLifecycle(Vue)
export default Vue