export function createElement(context, tag, key, data, children) {
  return new VNode(context, tag, 1, key, data, children);
}
export function createTextVNode(context, text) {
  return new VNode(context, undefined, 2, undefined, undefined, undefined, text);
}
class VNode {
  constructor(context, tag, type, key, data, children, text) {
    this.context = context;
    this.tag = tag;
    this.type = type;
    this.key = key;
    this.text = text;
    this.data = data;
    this.children = children;
  }
}
