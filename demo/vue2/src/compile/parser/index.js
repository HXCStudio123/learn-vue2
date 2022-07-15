// 属性匹配：《 v-bind:test="msg" 》
// id="app"
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
// 匹配开始的标签<div
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 判断是否为开始标签的开头 <
// 匹配开始的结束标签>
const startTagClose = /^\s*(\/?)>/; // 判断是否为开始标签的结尾 >
// 匹配关闭标签 </div>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 判断是否为闭标签， </xxx>
/**
 * <div id="app">
      text
      <span>{{msg}}</span>
      <span>{{msg}}</span>
    </div>
  1. 确定组装的节点数据
  2. 组装结构

  词法分析：把语言拆成语义上不可分割的最小单元，及token
  语法分析：将词法分析获取的token组装

 * @param {*} html 
 */
export function parseHTML(html) {
  // 堆栈推入，匹配开始关闭
  let stack = [];
  let root = null;
  let currentParent = null;
  while (html) {
    let textEnd = html.indexOf("<");
    if (textEnd === 0) {
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        end(endTagMatch.tagName);
        advance(endTagMatch[0].length);
        continue;
      }
      const startTagMatch = parseStartTag();
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
        continue;
      }
    }
    if (textEnd > 0) {
      const text = html.substring(0, textEnd);
      if (text) {
        chars(text);
        advance(text.length);
      }
    }
  }
  return root;

  function advance(index) {
    html = html.substring(index);
  }
  function parseStartTag() {
    const start = html.match(startTagOpen);
    if (start) {
      // 开始标签
      const match = {
        tagName: start[1], // 标签名
        attrs: [], // 属性
      };
      advance(start[0].length);
      let end, attr;
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5],
        });
        advance(attr[0].length);
      }
      if (end) {
        advance(end[0].length);
      }
      return match;
    }
    return false;
  }
  function start(tag, attrs) {
    const node = createASTElement(tag, attrs);
    if (!root) {
      root = node;
    }
    if (currentParent) {
      currentParent.children.push(node);
    }
    stack.push(node);
    currentParent = node;
  }
  function chars(text) {
    text = text.replace(/\s/g, "");
    if (text) {
      currentParent.children.push({
        type: 2,
        text,
        parent: currentParent
      });
    }
  }
  function end(tag) {
    stack.pop();
    if (stack.length) {
      currentParent = stack[stack.length - 1];
    }
  }
}

// 创建Ast标签节点
function createASTElement(tag, attrs) {
  return {
    tag,
    attrs,
    tyep: 1,
    children: [],
    parent: null,
  };
}
