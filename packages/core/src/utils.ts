import { MentionOption } from '../types/vue-mentions'
import { DOM_CLASSES } from './config'
export const getMatchMention = (options: MentionOption[], input: string) => {
  let match = null
  let option = null
  for (let i = 0; i < options.length; i++) {
    match = input.match(new RegExp(`^@${options[i].label}\\s{1}?`))

    if (match) {
      option = options[i]
      break
    }
  }

  return option
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

export const createAtElement = () => {
  const oAt = document.createElement('span')
  oAt.className = DOM_CLASSES.AT
  oAt.textContent = '@'
  return oAt
}

export const createMentionElement = (label: string, value: any) => {
  const oM = document.createElement('em')
  oM.className = DOM_CLASSES.MENTION
  oM.setAttribute('data-id', value)
  // @ts-ignore
  oM.setAttribute('contenteditable', false)
  oM.innerText = `@${label} `
  return oM
}

export const insertNodeAfterRange = (node: Node) => {
  const selection = window.getSelection()!
  const range = selection.getRangeAt(0)
  range.insertNode(node)
  setRangeAfterNode(node)
}

export const setRangeAfterNode = (node: Node) => {
  const selection = window.getSelection()!
  const range = new Range()
  range.setStartAfter(node)
  range.setEndAfter(node)
  selection.removeAllRanges()
  selection.addRange(range)
}

export function integerValidator (value: number) {
  return !Number.isNaN(value) && value >= 0
}
