import { type MentionDropdownListOption } from '../libs/renderer'
import { DOM_CLASSES, MENTION_DOM_REG, MENTION_REG, initialOptions } from '../config'
import { type MentionOptions } from '../mentions'
import { type HTMLString } from '../types'

export const mergeOptions = <T extends MentionOptions>(options?: T): Required<T> => {
  return {
    ...initialOptions,
    ...options
  } as unknown as Required<T>
}

export const computePosition = (contrastElement: HTMLElement, targetElement: HTMLElement) => {
  const contrastRect = contrastElement.getBoundingClientRect()
  const targetRect = targetElement.getBoundingClientRect()
  const { innerWidth, innerHeight } = window

  const availableWidth = Math.min(innerWidth, targetRect.width)
  let availableHeight = Math.min(innerHeight, targetRect.height)

  const x = contrastRect.left + availableWidth > innerWidth
    ? innerWidth - availableWidth
    : contrastRect.left
  let y = contrastRect.bottom

  if (contrastRect.bottom + targetRect.height > innerHeight) {
    if (contrastRect.top - targetRect.height < 0) {
      // 无法正确放置，尝试选择最优位置，并重置 target 高度
      if (Math.abs(contrastRect.bottom + targetRect.height - innerHeight) > Math.abs(contrastRect.top - targetRect.height)) {
        // 上面剩余位置多，放置在上面
        availableHeight = contrastRect.top
        y = 0
      } else {
        // 下面剩余位置多，放置在下面
        availableHeight = innerHeight - y
      }
    } else {
      // 放在上面
      y = contrastRect.top - availableHeight
    }
  }

  return {
    x,
    y,
    availableWidth,
    availableHeight
  }
}

export const createAtElement = (prefix: string) => {
  const oAt = document.createElement('span')
  oAt.className = DOM_CLASSES.AT
  oAt.textContent = prefix
  return oAt
}

export const createMentionElement = (name: string, id: string | number, prefix: string, suffix: string) => {
  const oM = document.createElement('em')
  oM.className = DOM_CLASSES.MENTION
  oM.setAttribute('data-id', `${id}`)
  oM.setAttribute('data-name', name)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  oM.setAttribute('contenteditable', false)
  oM.innerText = `${prefix}${name}${suffix}`
  return oM
}

export const insertNodeAfterRange = (node: Node, range?: Range, isClick?: boolean) => {
  if (!range) {
    range = window.getSelection()!.getRangeAt(0)
  }
  range.insertNode(node)
  if (!isClick) {
    setRangeAfterNode(node)
  }
}

export const setRangeAfterNode = (node: Node) => {
  const selection = window.getSelection()!
  const range = new Range()
  range.setStartAfter(node)
  range.setEndAfter(node)
  selection.removeAllRanges()
  selection.addRange(range)
}

/**
 * 判断 node2 是否在 node1 之后
 * @param {Node} node1
 * @param {Node} node2
 */
export const isNodeAfterNode = (node1: Node, node2: Node) => {
  return (node1.compareDocumentPosition(node2) & Node.DOCUMENT_POSITION_FOLLOWING) === Node.DOCUMENT_POSITION_FOLLOWING
}

/**
 * 判断元素是否为 Mention 元素
 */
export const isMention = (node: Node) => {
  return [...document.querySelectorAll(`.${DOM_CLASSES.MENTION}`) as unknown as HTMLElement[]].some(m => m.contains(node))
}

export function integerValidator (value: number) {
  return typeof value === 'number' && !Number.isNaN(value) && value > 0 && value % 1 === 0
}

export const valueFormatter = (innerHTML: HTMLString, parser?: (id: string, name: string) => string) => {
  const oDiv = document.createElement('div')

  oDiv.innerHTML = innerHTML
    .replace(/(<(?:br)[^>]*>)/ig, '\n')
    .replace(
      MENTION_DOM_REG,
      (_, $id: string, $name: string) => {
        return typeof parser === 'function'
          ? parser($id, $name)
          : `#{name:${$name},id:${$id}}`
      }
    )
  return oDiv.innerText
}

export const isEmptyTextNode = (node: Node) => node.nodeType === 3 && !node.nodeValue?.length

export const computeMentionLength = (mention: MentionDropdownListOption, calculator?: null | ((m: MentionDropdownListOption) => number)) => {
  return typeof calculator === 'function'
    ? calculator(mention)
    : `#{name:${mention.name},id:${mention.id}}`.length
}

export const getMentionPattern = (pattern: RegExp | string) => {
  const g = new RegExp(pattern, 'g')
  return {
    global: g,
    single: new RegExp(g.source, g.flags.replace('g', ''))
  }
}

export const getValueLength = (value: string, pattern: RegExp = MENTION_REG, getMentionLength?: null | ((mention: MentionDropdownListOption) => number)) => {
  const mentionPattern = getMentionPattern(pattern)
  const match = value.match(mentionPattern.global) as unknown as string[]
  return value.replace(mentionPattern.global, '').length + (match ?? []).reduce((count: number, mentionStr: string) => {
    const m = mentionStr.match(mentionPattern.single)

    return count + (
      !m
        ? 0
        : computeMentionLength({ name: m[1], id: m[2] }, getMentionLength)
    )
  }, 0)
}

export const isEmptyArray = (arr: unknown) => !Array.isArray(arr) || arr.length === 0

export const isFunction = (fn: unknown) => typeof fn === 'function'
