import { nextTick } from "../utils/index.js";
import Dep from "./dep";

let id = 0;
/**
 * 观察者
 */
export default class Watcher {
  constructor(vm, expOrFn, options, renderWatcher, cb) {
    this.id = id++;
    this.vm = vm;
    this.cb = cb;
    this.renderWatcher = renderWatcher;
    /**
     * expOrFn 和 cb
     * expOrFn：是自定义获取对应值的表达式（或字符串）
     * cb：是获取触发时的回调函数
     */
    if (typeof expOrFn === "string") {
      this.getter = function () {
        return this[expOrFn];
      };
    } else {
      this.getter = expOrFn;
    }
    this.newDeps = [];
    this.newDepsId = new Set();
    // 懒更新 computed & watch(用户自定义的watch)
    if (options) {
      this.lazy = !!options.lazy;
      this.user = !!options.user;
    }
    this.dirty = this.lazy;
    // watcher初渲染
    this.lazy ? undefined : this.get();
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
  excutate() {
    this.dirty = false;
    this.value = this.get();
  }
  get() {
    // debugger;
    const oldValue = this.value;
    pushStack(this);
    this.value = this.getter.call(this.vm);
    popStack();
    if (this.user) {
      this.cb.call(this.vm, this.value, oldValue);
    }
    return this.value;
  }
  update() {
    if (this.lazy) {
      // 有依赖的值发生变化，表示需要获取新值，此时只是更改了获取的computed watcher，不需要视图渲染，此时能拿到新值了
      this.dirty = true;
    } else {
      queueWatcher(this);
    }
    // this.get();
  }
  run() {
    this.get();
  }
  // 给当前watcher添加dep依赖
  depend() {
    for (let dep of this.newDeps) {
      dep.depend();
    }
  }
}
Dep.target = null;
let stack = [];
function pushStack(watcher) {
  stack.push(watcher);
  Dep.target = watcher;
}
function popStack() {
  stack.pop();
  Dep.target = stack[stack.length - 1];
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
