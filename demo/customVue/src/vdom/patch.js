/**
 * 虚拟DOM转真实DOM
 * @param {*} oldVnode
 * @param {*} vnode
 */
export function patch(oldVnode, vnode) {
  if (oldVnode === vnode) {
    return;
  }
  const isRealElement = oldVnode.nodeType;
  if (isRealElement) {
    // 获取真实元素
    const elm = oldVnode;
    const parentElm = elm.parentNode;
    // 拿到父元素
    const newElm = createElm(vnode);
    parentElm.insertBefore(newElm, elm.nextSibling);
    parentElm.removeChild(elm);
    return newElm;
  } else {
    // Diffi
  }
}

// 根据vnode创建真实DOM节点
function createElm(vnode, parentElm) {
  // 初始化
  const { tag, data, children, text } = vnode;
  if (typeof tag === "string") {
    // 创建标签，此时将真实节点和虚拟节点对应起来，为以后diff算法修改对应节点做准备
    vnode.elm = document.createElement(tag);
    if (data) {
      updateProps(vnode.elm, data);
    }
    // 创建子节点
    createChildren(vnode, children);
  } else {
    vnode.elm = document.createTextNode(text);
  }
  insert(parentElm, vnode.elm);
  return vnode.elm;
}

function createChildren(vnode, children) {
  if (Array.isArray(children)) {
    for (let item of children) {
      createElm(item, vnode.elm);
    }
  }
}

function insert(parent, elm) {
  if (parent) {
    parent.appendChild(elm);
  }
}

// 属性值插入
function updateProps(el, props) {
  for (let key in props) {
    el.setAttribute(key, props[key]);
  }
}
