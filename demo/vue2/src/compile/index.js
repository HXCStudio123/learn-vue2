import { parseHTML } from "./parser/index"

/**
 * 模板引擎，
 * 1. 解析html，生成ast语法树
 * 2. 根据ast语法树生成render函数
 * 3. render函数将
 * @param {String} html 
 */ 
export function compileToFunctions(html) {
  const ast = parseHTML(html)
}