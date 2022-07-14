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
 * @param {*} html 
 */

    export function parseHTML(html) {
  console.log(html);
  while (html) {
    let textEnd = html.indexOf("<");
    if (textEnd === 0) {
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        advance(endTagMatch[0].length)
        continue;
      }
      const startTagMatch = parseStartTag();
    }
    if (textEnd > 0) {
      const text = html.substring(0, textEnd);
      if (text) {
        advance(text.length);
      }
    }
  }
  console.log('---', html);
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
    }
    return false;
  }
}
