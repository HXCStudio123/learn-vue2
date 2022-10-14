export * from "./next-tick";
export const def = function (obj, key, value) {
  Object.defineProperty(obj, key, {
    enumerable: false,
    value,
  });
};

/**
 * 从这里可以看出Vue的数值优先级子元素更高
 * @param {*} parent
 * @param {*} child
 * @returns
 */
function mergeHook(parent, child) {
  let res;
  if (child) {
    if (parent) {
      res = parent.concat(child);
    } else {
      res = [child];
    }
  } else {
    res = parent;
  }
  return res;
}
const strats = {};
const LIFECYCLE_HOOKS = ["beforeCreate", "created"];
LIFECYCLE_HOOKS.forEach((hook) => {
  strats[hook] = mergeHook;
});
export function mergeOptions(parent, child) {
  let options = {};
  let key;
  for (key in parent) {
    mergeField(key);
  }
  for (key in child) {
    if (!parent[key]) {
      mergeField(key);
    }
  }
  /**
   * 策略模式合并
   * @param {*} key
   */
  function mergeField(key) {
    const strat = strats[key] || defaultStrat;
    options[key] = strat(parent[key], child[key]);
  }
  return options;
}
// 以生命周期为例其他的不处理
function defaultStrat(parent, child) {
  return child || parent;
}
