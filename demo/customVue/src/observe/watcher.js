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
    queueWatcher(this);
  }
  run() {
    this.get()
  }
}

let queue = [];
let watcherIds = new Set();
let waiting = false;

function flushSchedulerQueue() {
  for(let watcher of queue) {
    watcher.run()
  }
}

/**
 * 存放watcher更新队列，如果watcher需要更新，那么收集当前需要更新的watcher
 * @param {Watcher} watcher
 */
function queueWatcher(watcher) {
  if(!waiting) {
    waiting = true
  }
  // 没有重复watcher
  if (!watcherIds.has(watcher.id)) {
    queue.push(watcher)
    watcherIds.add(watcher.id)
  }
}
