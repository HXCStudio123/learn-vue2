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
    // this.get();
  }
  run() {
    this.get();
  }
}

let queue = [];
let watcherIds = new Set();
let pending = false;

/**
 * 批处理watcher更新
 */
function flushSchedulerQueue() {
  for (let watcher of queue) {
    watcher.run();
  }
  // 执行后状态初始化
  pending = false;
  queue = [];
  watcherIds = new Set();
}

/**
 * 存放watcher更新队列，如果watcher需要更新，那么收集当前需要更新的watcher
 * @param {Watcher} watcher
 */
function queueWatcher(watcher) {
  // 查看是否有重复的watcher
  if (!watcherIds.has(watcher.id)) {
    // 添加进队列等待统一处理
    queue.push(watcher);
    watcherIds.add(watcher.id);
  }
  if (!pending) {
    pending = true;
    nextTick(flushSchedulerQueue);
  }
}

// 采用优雅降级的方式
let callbacks = [];
let waiting = false;
let timeFn = null;

if (Promise) {
  timeFn = () => {
    Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  let counter = 1;
  const observer = new MutationObserver(flushCallbacks);
  const textNode = document.createTextNode(String(counter));
  observer.observe(textNode, {
    characterData: true,
  });
  timeFn = () => {
    counter = (counter + 1) % 2;
    textNode.data = String(counter);
  };
} else if (setTimeout) {
  timeFn = () => {
    setTimeout(flushCallbacks, 0);
  };
} else if (setInterval) {
  timeFn = () => {
    setInterval(flushCallbacks);
  };
}

function flushCallbacks() {
  callbacks.forEach((cb) => cb());
  callbacks = [];
  waiting = false;
}

/**
 * 确认自定义nextTick和内部渲染的执行顺序，维护了一个执行异步的队列
 * @param {*} cb 回调函数，可能是执行的渲染get 也可能是用户自定义执行的函数
 * @param {*} time
 */
export function nextTick(cb) {
  callbacks.push(cb);
  if (!waiting) {
    waiting = true;
    timeFn();
  }
}
