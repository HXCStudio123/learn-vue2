import { generate } from "./codeGen/index";
import { parseHTML } from "./parser/index";

/**
 * 模板引擎，
 * 1. 解析html，生成ast语法树
 * 2. 根据ast语法树生成render函数
 * 3. render函数将
 * @param {String} html
 */
export function compileToFunctions(html) {
  const ast = parseHTML(html);
  // 根据ast生成render函数
  /**
   * <div id="app">
      text
      <span>{{msg}}</span>
    </div>

    ast树

    render(h) {
      return h('div', [{id: "app"], h('span', null, null)}])
    }
    _c("div", {id: "app"}, _c("span", null, _v(_s(msg) + "test"))
   */
  const { render } = generate(ast);
  return render;
}
