import Dep from "./dep";

let id = 0;
/**
 * 观察者
 */
export default class Watcher {
  constructor(vm, fn, renderWatcher) {
    this.id = id++;
    this.vm = vm;
    this.renderWatcher = renderWatcher;
    this.getter = fn;
    this.newDeps = [];
    this.newDepsId = new Set();
    // watcher初渲染
    this.get();
  }
  addDep(dep) {
    // 去重
    if (!this.newDepsId.has(dep.id)) {
      // 建立 watcher -> dep 对应关系
      this.newDeps.push(dep);
      this.newDepsId.add(dep.id);
      // 建立 dep -> watcher 对应关系
      dep.addSub(this);
    }
  }
  get() {
    Dep.target = this;
    this.getter();
    Dep.target = null;
  }
  update() {
    this.get();
  }
}
