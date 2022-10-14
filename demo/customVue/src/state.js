import Dep from "./observe/dep";
import { observe } from "./observe/index";
import Watcher from "./observe/watcher";
/**
 * 实现数据的代理，可由vm.xxx 代理到 vm._data上
 * @param {*} target 目标对象
 * @param {*} sourceKey 当前key对应真实位置
 * @param {*} key 被查找的key
 */
function proxy(target, sourceKey, key) {
  // vm[name] -> vm[sourceKey][key]
  Object.defineProperty(target, key, {
    get() {
      return target[sourceKey][key];
    },
    set(newValue) {
      target[sourceKey][key] = newValue;
    },
  });
}

function initData(vm) {
  let data = vm.$options.data;
  // data 可能是函数也可能是一个对象
  // 如果是函数希望执行
  // 不是函数直接使用data
  data = typeof data === "function" ? data.call(vm) : data;
  vm._data = data;
  // 响应式实现，对data进行劫持
  observe(data);
  Object.keys(data).forEach((key) => {
    proxy(vm, "_data", key);
  });
}

export function initState(vm) {
  const opts = vm.$options;
  // 初始化data、props、method等
  if (opts.data) {
    initData(vm);
  }
  if (opts.computed) {
    initComputed(vm, opts.computed);
  }
  if (opts.watch) {
    initWatch(vm, opts.watch);
  }
}

function initComputed(vm, computed) {
  let watchers = (vm._computedWatchers = []);
  for (let key in computed) {
    const userDef = computed[key];
    const getter = typeof userDef === "function" ? userDef : userDef.get;
    watchers[key] = new Watcher(vm, getter, { lazy: true }, false);
    defineComputed(vm, key, userDef);
  }
}

function defineComputed(target, key, userDef) {
  const setter = typeof userDef === "function" ? () => {} : userDef.set;
  Object.defineProperty(target, key, {
    get: createComputedGetter(target._computedWatchers[key]),
    set: setter,
  });
}

function createComputedGetter(watcher) {
  return function () {
    if (watcher.dirty) {
      // 执行计算
      watcher.excutate();
    }
    if (Dep.target) {
      // 将计算属性watcher内的dep，加到当前的渲染watcher上，使dep属性变更时可以同步watcher视图更新
      watcher.depend();
    }
    return watcher.value;
  };
}

function initWatch(target, watch) {
  for (let key in watch) {
    createWatcher(target, key, watch[key]);
  }
}
function createWatcher(vm, key, cb) {
  vm.$watch(key, cb);
}