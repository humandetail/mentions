import { DOM_CLASSES } from '../config'
import type { Context } from '../mentions'
import { computePosition, createAtElement, getValueLength, integerValidator, isMention, isNodeAfterNode, setRangeAfterNode, valueFormatter } from '../utils'

const createEventHandler = () => {
  let _context!: Context
  const handleKeydown = (e: KeyboardEvent) => {
    const { key } = e
    const {
      state: {
        type
      },
      dropdown
    } = _context

    if (!dropdown?.visible) {
      if (key === 'Enter') {
        e.preventDefault()
        if (type === 'textarea') {
          const selection = window.getSelection()!
          if (selection.focusNode?.nextSibling) {
            document.execCommand('insertHTML', false, '<br/>')
            return
          }

          const range = selection.getRangeAt(0)
          range.deleteContents()
          const br = document.createElement('br')
          range.insertNode(br)

          // 将光标移到 br 标签的下一行
          range.setStartAfter(br)
          range.setEndAfter(br)
          selection.removeAllRanges()
          selection.addRange(range)
          range.insertNode(document.createElement('br'))
        }
      }
    }
  }

  const handleClick = () => {
    const { dropdown } = _context
    if (dropdown?.visible) {
      dropdown.hide(true)
    }
  }

  const handleScroll = () => {
    const {
      state: {
        type
      },
      dropdown,
      container
    } = _context
    if (type !== 'textarea' || !dropdown?.visible) {
      return
    }

    const oDropdown = container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN}`)!
    const oAt = container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!

    const { top, bottom } = container.querySelector(`.${DOM_CLASSES.INPUT}`)!.getBoundingClientRect()
    const { x, y, availableWidth, availableHeight } = computePosition(oAt, oDropdown)
    Object.assign(oDropdown.style, {
      left: `${x}px`,
      top: `${Math.min(bottom, Math.max(top, y))}px`,
      width: `${availableWidth}px`,
      height: `${availableHeight}px`
    })
  }

  const handleBeforeInput = (e: InputEvent) => {
    const {
      state: {
        maxLength,
        prefix,
        formatter,
        getMentionLength
      }
    } = _context

    const { data } = e
    const target = e.target as HTMLElement

    const value = valueFormatter(target.innerHTML, formatter?.parser)
    const valueLength = getValueLength(value, formatter?.pattern, getMentionLength)

    if (integerValidator(maxLength) && valueLength + 1 > maxLength) {
      return
    }

    // 输入 `@` 符号时，展开 Mentions 列表
    if (data === prefix) {
      e.preventDefault()

      // 防止重复插入 @ 符号
      // 在 windows 上使用输入法组合输入时，会触发两次 beforeinput 事件，这会导致多次插入 @ 符号
      if (_context.container.querySelector(`.${DOM_CLASSES.AT}`)) {
        return
      }

      // 强行修正 @ 里的内容，将多个 @ 合并成一个
      setTimeout(() => {
        if (_context.dropdown?.visible) {
          const oAt = _context.container.querySelector(`.${DOM_CLASSES.AT}`)
          if (oAt) {
            oAt.textContent = prefix
          }
        }
      })

      const range = window.getSelection()!.getRangeAt(0)
      const oAt = createAtElement(prefix)

      range.insertNode(oAt)
      setRangeAfterNode(oAt.firstChild!)
      show()
    }
  }

  const handleInput = (e: Event) => {
    const {
      state: {
        maxLength,
        formatter
      }
    } = _context
    const target = e.target as HTMLElement

    const value = valueFormatter(target.innerHTML, formatter?.parser)

    // 输入达到最大值的时候还原输入框的值
    if (integerValidator(maxLength) && getValueLength(value) > maxLength) {
      _context.renderer.restoreState(_context)
      return
    }

    _context.state.value = value
    _context.renderer.getMentionsByValueChange(_context)
    _context.emitter.emit('change', value)
  }

  const handleMousedown = () => {
    document.addEventListener('mouseup', handleMouseup, { once: true })
  }

  const handleMouseup = () => {
    const selection = window.getSelection()!
    const { anchorNode, focusNode } = selection
    const range = selection.getRangeAt(0)

    // 单击 mention
    if (
      anchorNode === focusNode &&
      (
        isMention(anchorNode!) ||
        isMention(anchorNode!.parentNode!)
      )
    ) {
      range.selectNode(
        isMention(anchorNode!)
          ? anchorNode!
          : anchorNode!.parentNode!
      )
      selection.removeAllRanges()
      selection.addRange(range)
      return
    }

    // 结束点选中 mention
    if (isMention(anchorNode!) || isMention(focusNode!)) {
      if (isNodeAfterNode(anchorNode!, focusNode!)) {
        range.setEndAfter(focusNode!)
      } else {
        range.setStartBefore(focusNode!)
      }
    }
  }

  const show = async () => {
    _context.renderer.recordState(_context)
    _context.dropdown?.show()
    _context.emitter.emit('show')
  }

  const handleFocus = (e: Event) => {
    const target = e.target as HTMLElement
    target.classList.add(DOM_CLASSES.FOCUSED)
  }

  const handleBlur = (e: Event) => {
    const target = e.target as HTMLElement
    target.classList.remove(DOM_CLASSES.FOCUSED)
  }

  const registerEvents = (context: Context) => {
    _context = context
    const { editor } = context

    // editor.addEventListener('keydown', (e) => { e.preventDefault(); console.log(e) })
    // editor.addEventListener('keydown', (e) => { e.preventDefault(); console.log(e) })

    editor.addEventListener('beforeinput', handleBeforeInput)
    editor.addEventListener('input', handleInput)
    editor.addEventListener('keydown', handleKeydown)
    editor.addEventListener('click', handleClick)
    editor.addEventListener('scroll', handleScroll)
    editor.addEventListener('mousedown', handleMousedown)
    editor.addEventListener('focus', handleFocus)
    editor.addEventListener('blur', handleBlur)
  }

  const cancelEvents = ({ editor }: Context) => {
    editor.removeEventListener('beforeinput', handleBeforeInput)
    editor.removeEventListener('input', handleInput)
    editor.removeEventListener('keydown', handleKeydown)
    editor.removeEventListener('click', handleClick)
    editor.removeEventListener('scroll', handleScroll)
    editor.removeEventListener('mousedown', handleMousedown)
    editor.removeEventListener('focus', handleFocus)
    editor.removeEventListener('blur', handleBlur)
  }

  return {
    registerEvents,
    cancelEvents
  }
}

export {
  createEventHandler
}
