// @ts-nocheck
import { MENTION_REG, DOM_CLASSES, integerValidator } from '../libs/config'
import { isEmptyTextNode } from '../libs/utils'

export default {
  data () {
    return {
      // 记录选区及当前内容
      state: {
        innerHTML: '',
        anchorNodeIdx: -1,
        anchorOffset: -1,
        focusNodeIdx: -1,
        focusOffset: -1
      }
    }
  },

  methods: {
    formatContent (val) {
      const { formatter } = this
      const content = []

      const reg = formatter?.pattern || MENTION_REG

      while (val.length) {
        const match = val.match(reg)
        if (match) {
          const option = {
            label: match[1],
            value: match[2]
          }
          content.push(option)
          this.currentMentions.push(option)
          val = val.replace(reg, '')
        } else {
          const lastVal = typeof content.at(-1) === 'string'
            ? content.pop()
            : ''

          content.push(`${lastVal}${val[0]}`)
          val = val.slice(1)
        }
      }

      this.content = content
      return content
    },

    renderMentionContent (id: string, name: string) {
      const { prefix, suffix, formatter } = this

      if (typeof formatter?.render === 'function') {
        return formatter.render(id, name)
      }

      if (typeof formatter?.render === 'object' && formatter.render.scopedSlot) {
        return this.$slots[formatter.render.scopedSlot]({ id, name })
      }

      return `${prefix}${name}${suffix}`
    },

    renderFailureAt (oAt: HTMLElement, oEditor: HTMLElement) {
      let text = oAt.textContent
      const { maxLength, valueLength } = this
      // 对内容进行截取
      if (integerValidator(maxLength) && valueLength + text.length > maxLength) {
        text = text.slice(0, maxLength - valueLength)
      }
      // 1. 查询 oAt 在 childNodes 中的位置 oAtIndex
      const { childNodes } = oEditor
      const oAtIndex = [].indexOf.call(childNodes, oAt)
      // 2. 查询当前光标所在位置
      const selection = window.getSelection()
      const {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      } = selection

      const prevNode = childNodes[oAtIndex - 1]
      const nextNode = childNodes[oAtIndex + 1]

      const anchorNodeIdx = [].indexOf.call(childNodes, anchorNode?.parentNode?.classList.contains(DOM_CLASSES.AT) ? anchorNode.parentNode : anchorNode)
      const focusNodeIdx = [].indexOf.call(childNodes, focusNode?.parentNode?.classList.contains(DOM_CLASSES.AT) ? focusNode.parentNode : focusNode)

      const anchorNodeIsEditor = anchorNode === oEditor
      const focusNodeIsEditor = focusNode === oEditor

      // -1 左，0 本身，1 右
      const anchorIdxDiff = (anchorNodeIsEditor ? anchorOffset : anchorNodeIdx) - oAtIndex
      const focusIdxDiff = (focusNodeIsEditor ? focusOffset : focusNodeIdx) - oAtIndex

      // 记录左右 Node 类型
      const prevNodeType = prevNode.nodeType
      const nextNodeType = nextNode.nodeType
      // 记录 Node 内容长度
      const prevNodeValueLength = prevNode?.nodeValue?.length || 0
      const textNodeValueLength = oAt.firstChild?.length || 0
      // const nextNodeValueLength = nextNode?.nodeValue?.length || 0

      // 3. 替换内容
      oEditor.replaceChild(document.createTextNode(text), oAt)
      // textNode 合并
      // eslint-disable-next-line no-self-assign
      oEditor.innerHTML = oEditor.innerHTML

      // 4. 恢复 range
      selection.removeAllRanges()
      const range = new Range()

      if (anchorNodeIsEditor) {
        if (anchorIdxDiff < 0) {
          range.setStart(oEditor, anchorOffset)
        } else if (anchorIdxDiff > 0) {
          range.setStart(oEditor, anchorOffset - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0))
        }
      } else if (anchorIdxDiff === 0) {
        if (prevNodeType === 3) {
          range.setStart(oEditor.childNodes[oAtIndex - 1], prevNodeValueLength + anchorOffset)
        } else {
          range.setStart(oEditor.childNodes[oAtIndex], anchorOffset)
        }
      } else if (anchorIdxDiff === -1) {
        range.setStart(oEditor.childNodes[oAtIndex - 1], anchorOffset)
      } else if (anchorIdxDiff === 1) {
        if (prevNodeType === 3) {
          range.setStart(oEditor.childNodes[oAtIndex - 1], prevNodeValueLength + textNodeValueLength + anchorOffset)
        } else if (nextNodeType === 3) {
          range.setStart(oEditor.childNodes[oAtIndex], textNodeValueLength + anchorOffset)
        } else {
          range.setStart(oEditor.childNodes[oAtIndex + 1], anchorOffset)
        }
      } else if (anchorIdxDiff < -1) {
        range.setStart(oEditor.childNodes[anchorNodeIdx], anchorOffset)
      } else {
        range.setStart(oEditor.childNodes[anchorNodeIdx - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0)], anchorOffset)
      }

      if (focusNodeIsEditor) {
        if (focusIdxDiff < 0) {
          range.setEnd(oEditor, focusOffset)
        } else if (focusIdxDiff > 0) {
          range.setEnd(oEditor, focusOffset - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0))
        }
      } else if (focusIdxDiff === 0) {
        if (prevNodeType === 3) {
          range.setEnd(oEditor.childNodes[oAtIndex - 1], prevNodeValueLength + focusOffset)
        } else {
          range.setEnd(oEditor.childNodes[oAtIndex], focusOffset)
        }
      } else if (focusIdxDiff === -1) {
        range.setEnd(oEditor.childNodes[focusNodeIdx], focusOffset)
      } else if (focusIdxDiff === 1) {
        if (prevNodeType === 3) {
          range.setEnd(oEditor.childNodes[oAtIndex - 1], prevNodeValueLength + textNodeValueLength + focusOffset)
        } else if (nextNodeType === 3) {
          range.setEnd(oEditor.childNodes[oAtIndex], textNodeValueLength + focusOffset)
        } else {
          range.setEnd(oEditor.childNodes[oAtIndex + 1], focusOffset)
        }
      } else if (anchorIdxDiff < -1) {
        range.setEnd(oEditor.childNodes[focusNodeIdx], focusOffset)
      } else {
        range.setEnd(oEditor.childNodes[focusNodeIdx - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0)], focusOffset)
      }
      selection.addRange(range)
    },

    // 记录 state
    recordState () {
      const oEditor = this.$refs.Editor
      if (!oEditor) {
        return
      }
      const { childNodes: originChildNodes, innerHTML } = oEditor

      // 如果内容已经为空
      if (!innerHTML) {
        Object.assign(this.state, {
          innerHTML: '',
          anchorNodeIdx: 0,
          anchorOffset: 0,
          focusNodeIdx: 0,
          focusOffset: 0
        })

        return
      }

      let {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      } = window.getSelection()

      // 过滤 childNodes 空行
      const withoutEmptyTextChildNodes = [...originChildNodes].filter(node => !(node.nodeType === 3 && !node.nodeValue?.length))

      let anchorNodeIdx = -1
      let focusNodeIdx = -1

      if (anchorNode === oEditor) {
        anchorOffset = Math.min(anchorOffset, originChildNodes.length - 1)
        let n = originChildNodes[anchorOffset]
        while (n && isEmptyTextNode(n)) {
          anchorOffset--
          n = originChildNodes[anchorOffset]
        }
        anchorOffset = [].indexOf.call(withoutEmptyTextChildNodes, n)
      } else {
        anchorNodeIdx = [].indexOf.call(withoutEmptyTextChildNodes, anchorNode)
      }

      if (focusNode === oEditor) {
        focusOffset = Math.min(focusOffset, originChildNodes.length - 1)
        let n = originChildNodes[focusOffset]
        while (n && isEmptyTextNode(n)) {
          focusOffset--
          n = originChildNodes[focusOffset]
        }
        focusOffset = [].indexOf.call(withoutEmptyTextChildNodes, n)
      } else {
        focusNodeIdx = [].indexOf.call(withoutEmptyTextChildNodes, focusNode)
      }

      Object.assign(this.state, {
        anchorNodeIdx,
        focusNodeIdx,
        anchorOffset,
        focusOffset,
        innerHTML
      })
    },

    // 恢复 state
    restoreState (target: HTMLElement) {
      const {
        innerHTML,
        anchorNodeIdx,
        anchorOffset,
        focusNodeIdx,
        focusOffset
      } = this.state

      target.innerHTML = innerHTML
      const selection = window.getSelection()
      const { childNodes } = target
      const range = new Range()

      let anchorNode = childNodes[anchorNodeIdx]
      if (anchorNode?.nodeType !== 3) {
        anchorNode = target
        if (anchorOffset === childNodes.length - 1) {
          range.setStartAfter(childNodes[childNodes.length - 1])
        } else {
          range.setStart(anchorNode, anchorOffset)
        }
      } else {
        range.setStart(anchorNode, anchorOffset)
      }
      let focusNode = childNodes[focusNodeIdx]
      if (focusNode?.nodeType !== 3) {
        focusNode = target
        if (focusOffset === childNodes.length - 1) {
          range.setEndAfter(childNodes[childNodes.length - 1])
        } else {
          range.setEnd(focusNode, focusOffset)
        }
      } else {
        range.setEnd(focusNode, focusOffset)
      }
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}
