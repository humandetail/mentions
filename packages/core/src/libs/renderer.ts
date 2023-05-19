import { DOM_CLASSES, MENTION_REG } from '../config'
import type { Context, MentionOptions } from '../mentions'
import { computeMentionLength, createMentionElement, getValueLength, insertNodeAfterRange, integerValidator, isEmptyTextNode, valueFormatter } from '../utils'

export interface MentionDropdownListOption {
  name: string
  id: string
  disabled?: boolean
  customRender?: (option: MentionDropdownListOption, index: number) => string
}

const createRenderer = (options: Required<MentionOptions>) => {
  function createElement<T extends null = null> (tagName: T, props: null, children: Array<string | Text | HTMLElement | DocumentFragment>): Text
  function createElement<T extends (keyof HTMLElementTagNameMap)> (tagName: T, props: null | Record<string, string | boolean>, children?: Array<string | Text | HTMLElement | DocumentFragment>): HTMLElementTagNameMap[T]
  function createElement<T extends (keyof HTMLElementTagNameMap) | null> (
    tagName: null | T,
    props: null | Record<string, string | boolean>,
    children: Array<string | Text | HTMLElement | DocumentFragment> = []
  ) {
    if (!tagName && !children?.[0]) {
      throw new TypeError(`"tagName" expect a HTMLElementTagName, but got "${tagName!}"`)
    }

    if (!tagName) {
      return document.createTextNode(children[0] as string)
    }

    const el = document.createElement(tagName)

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        el.setAttribute(key, value as string)
      })
    }

    children?.forEach(child => {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child))
      } else {
        el.appendChild(child)
      }
    })

    return el
  }

  const formatContent = (val: string) => {
    const { formatter } = options

    const reg = formatter?.pattern ?? MENTION_REG

    return val.replace(/\n/g, '<br />').replace(reg, (_, name: string, id: string) => {
      return `<em
        class="${DOM_CLASSES.MENTION}"
        data-id=${id}"
        data-name="${name}"
        contenteditable="false"
      >${renderMentionContent(id, name)}</em>`
    })
  }

  const renderMentionContent = (id: string, name: string) => {
    const { prefix, suffix, formatter } = options
    return typeof formatter?.render === 'function'
      ? formatter.render(id, name)
      : `${prefix}${name}${suffix}`
  }

  const renderFailureAt = (oAt: HTMLElement, context: Context) => {
    let text = oAt.textContent ?? ''
    const { editor, state: { value } } = context
    const valueLength = getValueLength(value)
    const { maxLength } = options
    // 对内容进行截取
    if (integerValidator(maxLength) && valueLength + text.length > maxLength) {
      text = text.slice(0, maxLength - valueLength)
    }
    // 1. 查询 oAt 在 childNodes 中的位置 oAtIndex
    const childNodes = Array.from(editor.childNodes)
    const oAtIndex = childNodes.indexOf(oAt)
    // 2. 查询当前光标所在位置
    const selection = window.getSelection()!
    const {
      anchorOffset,
      focusOffset
    } = selection

    let anchorNode = selection.anchorNode! as HTMLElement
    let focusNode = selection.focusNode! as HTMLElement

    const prevNode = childNodes[oAtIndex - 1]
    const nextNode = childNodes[oAtIndex + 1]

    if ((focusNode.parentNode! as HTMLElement).classList.contains(DOM_CLASSES.AT)) {
      focusNode = focusNode.parentNode as HTMLElement
    }

    if ((anchorNode.parentNode! as HTMLElement).classList.contains(DOM_CLASSES.AT)) {
      anchorNode = anchorNode.parentNode as HTMLElement
    }

    const anchorNodeIdx = childNodes.indexOf(anchorNode)
    const focusNodeIdx = childNodes.indexOf(focusNode)

    const anchorNodeIsEditor = anchorNode === editor
    const focusNodeIsEditor = focusNode === editor

    // -1 左，0 本身，1 右
    const anchorIdxDiff = (anchorNodeIsEditor ? anchorOffset : anchorNodeIdx) - oAtIndex
    const focusIdxDiff = (focusNodeIsEditor ? focusOffset : focusNodeIdx) - oAtIndex

    // 记录左右 Node 类型
    const prevNodeType = prevNode.nodeType
    const nextNodeType = nextNode.nodeType
    // 记录 Node 内容长度
    const prevNodeValueLength: number = prevNode?.nodeValue?.length ?? 0
    const textNodeValueLength: number = (oAt.firstChild as Text)?.length ?? 0

    // 3. 替换内容
    editor.replaceChild(document.createTextNode(text), oAt)
    // textNode 合并
    // eslint-disable-next-line no-self-assign
    editor.innerHTML = editor.innerHTML

    // 4. 恢复 range
    selection.removeAllRanges()
    const range = new Range()

    if (anchorNodeIsEditor) {
      if (anchorIdxDiff < 0) {
        range.setStart(editor, anchorOffset)
      } else if (anchorIdxDiff > 0) {
        range.setStart(editor, anchorOffset - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0))
      }
    } else if (anchorIdxDiff === 0) {
      if (prevNodeType === 3) {
        range.setStart(editor.childNodes[oAtIndex - 1], prevNodeValueLength + anchorOffset)
      } else {
        range.setStart(editor.childNodes[oAtIndex], anchorOffset)
      }
    } else if (anchorIdxDiff === -1) {
      range.setStart(editor.childNodes[oAtIndex - 1], anchorOffset)
    } else if (anchorIdxDiff === 1) {
      if (prevNodeType === 3) {
        range.setStart(editor.childNodes[oAtIndex - 1], prevNodeValueLength + textNodeValueLength + anchorOffset)
      } else if (nextNodeType === 3) {
        range.setStart(editor.childNodes[oAtIndex], textNodeValueLength + anchorOffset)
      } else {
        range.setStart(editor.childNodes[oAtIndex + 1], anchorOffset)
      }
    } else if (anchorIdxDiff < -1) {
      range.setStart(editor.childNodes[anchorNodeIdx], anchorOffset)
    } else {
      range.setStart(editor.childNodes[anchorNodeIdx - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0)], anchorOffset)
    }

    if (focusNodeIsEditor) {
      if (focusIdxDiff < 0) {
        range.setEnd(editor, focusOffset)
      } else if (focusIdxDiff > 0) {
        range.setEnd(editor, focusOffset - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0))
      }
    } else if (focusIdxDiff === 0) {
      if (prevNodeType === 3) {
        range.setEnd(editor.childNodes[oAtIndex - 1], prevNodeValueLength + focusOffset)
      } else {
        range.setEnd(editor.childNodes[oAtIndex], focusOffset)
      }
    } else if (focusIdxDiff === -1) {
      range.setEnd(editor.childNodes[focusNodeIdx], focusOffset)
    } else if (focusIdxDiff === 1) {
      if (prevNodeType === 3) {
        range.setEnd(editor.childNodes[oAtIndex - 1], prevNodeValueLength + textNodeValueLength + focusOffset)
      } else if (nextNodeType === 3) {
        range.setEnd(editor.childNodes[oAtIndex], textNodeValueLength + focusOffset)
      } else {
        range.setEnd(editor.childNodes[oAtIndex + 1], focusOffset)
      }
    } else if (anchorIdxDiff < -1) {
      range.setEnd(editor.childNodes[focusNodeIdx], focusOffset)
    } else {
      range.setEnd(editor.childNodes[focusNodeIdx - (prevNodeType === 3 ? 1 : 0) - (nextNodeType === 3 ? 1 : 0)], focusOffset)
    }
    selection.addRange(range)
  }

  const appendMentions = (context: Context, mentions: MentionDropdownListOption[]) => {
    const {
      state: {
        prefix,
        suffix,
        value,
        maxLength
      },
      container,
      editor
    } = context

    // 1. 清除输入内容
    const range = new Range()
    range.selectNode(container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!)
    range.deleteContents()
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)

    mentions.forEach(mention => {
      // 2. 插入 @Mention 内容块并让光标位置插入块之后
      const oM = createMentionElement(mention.name, mention.id, prefix, suffix)

      if (!(integerValidator(maxLength) && getValueLength(value) + computeMentionLength(mention, context.state.getMentionLength) > maxLength)) {
        // 只允许在剩余长度足够的情况下插入 mention
        insertNodeAfterRange(oM)
      }
    })

    // 3. 关闭 dropdown
    context.dropdown?.hide()

    // 4. 记录新的内容
    const newValue = valueFormatter(editor.innerHTML, context.state.formatter?.parser)
    context.state.value = newValue
    getMentionsByValueChange(context)
    context.emitter.emit('change', newValue)
  }

  const getMentionsByValueChange = (context: Context) => {
    let {
      value: val,
      formatter
    } = context.state

    let match

    const reg = formatter?.pattern ?? MENTION_REG

    const currentMentions = []
    while (val?.length) {
      match = val.match(reg)
      if (!match) {
        val = val.slice(1)
      } else {
        currentMentions.push({
          name: match[1],
          id: match[2]
        })
        val = val.replace(reg, '')
      }
    }
    context.state.currentMentions = currentMentions
  }

  // 记录 state
  const recordState = (context: Context) => {
    const { editor } = context
    if (!editor) {
      return
    }
    const { childNodes: originChildNodes, innerHTML } = editor

    // 如果内容已经为空
    if (!innerHTML) {
      Object.assign(context.state.record, {
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
    } = window.getSelection()!

    // 过滤 childNodes 空行
    const withoutEmptyTextChildNodes = [...originChildNodes as unknown as Node[]].filter(node => !(node.nodeType === 3 && !node.nodeValue?.length))

    let anchorNodeIdx = -1
    let focusNodeIdx = -1

    if (anchorNode === editor) {
      anchorOffset = Math.min(anchorOffset, originChildNodes.length - 1)
      let n = originChildNodes[anchorOffset]
      while (n && isEmptyTextNode(n)) {
        anchorOffset--
        n = originChildNodes[anchorOffset]
      }
      anchorOffset = withoutEmptyTextChildNodes.indexOf(n)
    } else {
      anchorNodeIdx = withoutEmptyTextChildNodes.indexOf(anchorNode!)
    }

    if (focusNode === editor) {
      focusOffset = Math.min(focusOffset, originChildNodes.length - 1)
      let n = originChildNodes[focusOffset]
      while (n && isEmptyTextNode(n)) {
        focusOffset--
        n = originChildNodes[focusOffset]
      }
      focusOffset = withoutEmptyTextChildNodes.indexOf(n)
    } else {
      focusNodeIdx = withoutEmptyTextChildNodes.indexOf(focusNode!)
    }

    Object.assign(context.state.record, {
      anchorNodeIdx,
      focusNodeIdx,
      anchorOffset,
      focusOffset,
      innerHTML
    })
  }

  // 恢复 state
  const restoreState = (context: Context) => {
    const {
      innerHTML,
      anchorNodeIdx,
      anchorOffset,
      focusNodeIdx,
      focusOffset
    } = context.state.record

    const target = context.editor

    target.innerHTML = innerHTML
    const selection = window.getSelection()!
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

  return {
    createElement,
    formatContent,
    renderMentionContent,
    renderFailureAt,
    appendMentions,
    getMentionsByValueChange,
    recordState,
    restoreState
  }
}

export {
  createRenderer
}
