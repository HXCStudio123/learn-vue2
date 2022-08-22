const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g;

function genProps(props) {
  let code = "";
  props.forEach((prop) => {
    code += `,${prop.name}:${JSON.stringify(prop.value)}`;
  });
  return `{${code.slice(1)}}`;
}
function genText(text) {
  if (defaultTagRE.test(text)) {
    // {{}} 特殊处理
    let tokens = [];
    let match;
    let index = 0;
    let lastIndex = (defaultTagRE.lastIndex = 0);
    while ((match = defaultTagRE.exec(text))) {
      index = match.index;
      if (index > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
      }
      tokens.push(`_s(${match[1]})`);
      lastIndex = index + match[0].length;
    }
    if (lastIndex < text.length) {
      tokens.push(JSON.stringify(text.slice(lastIndex)));
    }
    return `_v(${tokens.join("+")})`;
  } else {
    return `_v(${JSON.stringify(text)})`;
  }
}
function genChildren(children) {
  let code = "";
  children.forEach((child) => {
    code += "," + genElement(child);
  });
  return code.slice(1);
}
export function genElement(ast) {
  if (ast.type === 2) {
    return genText(ast.text);
  }
  // _c("div", {id: "app"}, _c("span", null, _v(_s(msg) + "test"))
  let code = `_c("${ast.tag}", ${ast.attrs.length ? genProps(ast.attrs) : null},${ast.children.length ? genChildren(ast.children) : null})`;
  return code;
}
