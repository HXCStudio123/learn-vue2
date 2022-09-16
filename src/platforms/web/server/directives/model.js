/* @flow */

import { looseEqual, looseIndexOf } from 'shared/util'

// this is only applied for <select v-model> because it is the only edge case
// that must be done at runtime instead of compile time.
export default function model (node: VNodeWithData, dir: VNodeDirective) {
  if (!node.children) return
  const value = dir.value
  const isMultiple = node.data.attrs && node.data.attrs.multiple
  for (let i = 0, l = node.children.length; i < l; i++) {
    const option = node.children[i]
    if (option.tag === 'option') {
      if (isMultiple) {
        const selected =
          Array.isArray(value) &&
          (looseIndexOf(value, getValue(option)) > -1)
        if (selected) {
          setSelected(option)
        }
      } else {
        if (looseEqual(value, getValue(option))) {
          setSelected(option)
          return
        }
      }
    }
  }
}
/**
 * v-model指令解析后
 * ;(function anonymous() {
  with (this) {
    return _c('div', { attrs: { id: 'app' } }, [
      _c('input', {
        directives: [
          { name: 'model', rawName: 'v-model', value: msg, expression: 'msg' },
        ],
        domProps: { value: msg },
        on: {
          input: function ($event) {
            if ($event.target.composing) return
            // 隐式绑定了一个 input 函数，使数据修改后更新数据到源数据处
            // 比如 v-model = msg  其中msg就是源数据，在input的target.value更新后，将源数据msg对应值也修改了
            // v-model:msg = v-bind:msg + v-on:input
            msg = $event.target.value
          },
        },
      }),
    ])
  }
})
 * @param {*} option 
 * @returns 
 */
function getValue (option) {
  const data = option.data || {}
  return (
    (data.attrs && data.attrs.value) ||
    (data.domProps && data.domProps.value) ||
    (option.children && option.children[0] && option.children[0].text)
  )
}

function setSelected (option) {
  const data = option.data || (option.data = {})
  const attrs = data.attrs || (data.attrs = {})
  attrs.selected = ''
}
