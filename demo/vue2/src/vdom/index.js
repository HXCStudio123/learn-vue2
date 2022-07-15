export function createElement(context, tag, data, parent, ...children) {
  // _v("div", {id:"app"},_v("text"),_v("span", null,_v(_s(msg)+"test"+_s(age)+"34567890")))
  return new VNode(context, tag, data, children, parent, data.key);
}

export function createTextVNode(context, text) {
  return new VNode(context, tag, data, children, parent, data.key);
}

class VNode {
  constructor(context, tag, data, children, parent, key) {
    this.context = context;
    this.tag = tag;
    this.data = data;
    this.children = children;
    this.parent = parent;
    this.key = key || null;
  }
}
