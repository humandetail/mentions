import { DOM_CLASSES, MENTION_REG } from '../config'
import { MentionOptions } from '../mentions'
import { integerValidator } from '../utils'

export interface MentionDropdownListOption extends Record<string, any> {
  name: string
  id: string
  disabled?: boolean
  customRender?: (option: MentionDropdownListOption, index: number) => string
}

const createRenderer = (options: Required<MentionOptions>) => {
  const createElement = <T extends keyof HTMLElementTagNameMap>(
    tagName: null | T,
    props: null | Record<string, any>,
    children: Array<string | Text | HTMLElement> = []
  ) => {
    if (!tagName && !children?.[0]) {
      throw new TypeError(`"tagName" expect a HTMLElementTagName, but got "${tagName}"`)
    }

    if (!tagName) {
      return document.createTextNode(children[0] as string)
    }

    const el = document.createElement(tagName)

    if (props) {
      Object.entries(props).forEach(([key, value]) => {
        el.setAttribute(key, value)
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
    const content = []

    const reg = formatter?.pattern || MENTION_REG

    while (val.length) {
      const match = val.match(reg)
      if (match) {
        const option: MentionDropdownListOption = {
          name: match[1],
          id: match[2]
        }
        content.push(option)
        // @todo
        // this.currentMentions.push(option)
        val = val.replace(reg, '')
      } else {
        const lastVal: string = typeof content.at(-1) === 'string'
          ? content.pop() as string
          : ''

        content.push(`${lastVal}${val[0]}`)
        val = val.slice(1)
      }
    }
    // @todo
    // this.content = content
    return content
  }

  const renderMentionContent = (id: string, name: string) => {
    const { prefix, suffix, formatter } = options

    if (typeof formatter?.render === 'function') {
      return formatter.render(id, name)
    }

    // @todo
    // if (typeof formatter?.render === 'object' && formatter.render.scopedSlot) {
    //   return this.$slots[formatter.render.scopedSlot]({ id, name })
    // }

    return `${prefix}${name}${suffix}`
  }

  const renderFailureAt = (oAt: HTMLElement, oEditor: HTMLElement) => {
    let text = oAt.textContent ?? ''
    // @todo
    const valueLength = 1
    const { maxLength/** , valueLength */ } = options
    // 对内容进行截取
    if (integerValidator(maxLength) && valueLength + text.length > maxLength) {
      text = text.slice(0, maxLength - valueLength)
    }
    // 1. 查询 oAt 在 childNodes 中的位置 oAtIndex
    const childNodes = [...oEditor.childNodes as any]
    const oAtIndex = childNodes.indexOf(oAt)
    // 2. 查询当前光标所在位置
    const selection = window.getSelection()!
    const {
      anchorNode,
      anchorOffset,
      focusNode,
      focusOffset
    } = selection

    const prevNode = childNodes[oAtIndex - 1]
    const nextNode = childNodes[oAtIndex + 1]

    const anchorNodeIdx = childNodes.indexOf((anchorNode?.parentNode as HTMLElement)?.classList.contains(DOM_CLASSES.AT) ? anchorNode!.parentNode : anchorNode)
    const focusNodeIdx = childNodes.indexOf((focusNode?.parentNode as HTMLElement)?.classList.contains(DOM_CLASSES.AT) ? focusNode!.parentNode : focusNode)

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
    const textNodeValueLength = (oAt.firstChild as Text)?.length || 0
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
  }

  return {
    createElement,
    formatContent,
    renderMentionContent,
    renderFailureAt
  }
}

export {
  createRenderer
}
