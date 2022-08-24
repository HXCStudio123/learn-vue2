import { genElement } from "./events";

export function generate (ast) {
  let code = genElement(ast);
  code = `with(this) { return ${code} }`
  const render = new Function(code);
  // console.log(render)
  return {
    render
  }
}