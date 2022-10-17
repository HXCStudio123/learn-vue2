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
  const cbs = callbacks.slice(0)
  // 不能直接cbs执行后清空callbacks，因为在执行next时可能有其他子渲染执行，此时需要区分开当前渲染队列和子渲染队列，分别执行
  callbacks.length = 0
  waiting = false
  cbs.forEach((cb) => cb.call(this))
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
