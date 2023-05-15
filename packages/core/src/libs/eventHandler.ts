import { DOM_CLASSES } from '../config'
import { Context } from '../mentions'
import { computePosition, createAtElement, getValueLength, integerValidator, isMention, isNodeAfterNode, setRangeAfterNode, valueFormatter } from '../utils'

const createEventHandler = () => {
  let _context!: Context
  const handleKeydown = (e: KeyboardEvent) => {
    const { key } = e
    const {
      state: {
        dropdownVisible,
        type
      }
    } = _context

    if (dropdownVisible) {
      if (['ArrowDown', 'ArrowUp'].includes(key)) {
        e.preventDefault()
        _context.state.switchKey = key
        _context.renderer.switchActiveOption(_context)
      } else if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) {
        close()
      } else if (key === 'Enter') {
        e.preventDefault()
        _context.renderer.appendMentionByIndex(_context)
      }
    } else {
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
    if (_context.state.dropdownVisible) {
      close()
    }
  }

  const handleScroll = () => {
    const {
      state: {
        dropdownVisible,
        type
      },
      container
    } = _context
    if (type !== 'textarea' || !dropdownVisible) {
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

  const handleBeforeInput = (e: Event) => {
    const {
      state: {
        dropdownVisible,
        maxLength,
        prefix,
        formatter,
        filterValue,
        getMentionLength
      }
    } = _context

    const { data, inputType } = e as InputEvent
    const target = e.target as HTMLElement

    const value = valueFormatter(target.innerHTML, formatter?.parser)
    const valueLength = getValueLength(value, formatter?.pattern, getMentionLength)

    if (!dropdownVisible) {
      _context.renderer.recordState(_context)
    }

    if (integerValidator(maxLength) && valueLength + 1 > maxLength) {
      return
    }

    // 在进行过滤时，不允许向后删除数据
    if (
      dropdownVisible &&
      inputType === 'deleteContentForward' &&
      !(window.getSelection()!.getRangeAt(0)!.startOffset - 1 === (filterValue?.length ?? 0))
    ) {
      e.preventDefault()
      return
    }

    // 输入 `@` 符号时，展开 Mentions 列表
    if (data === prefix && !dropdownVisible) {
      e.preventDefault()

      const range = window.getSelection()!.getRangeAt(0)

      const oAt = createAtElement(prefix)

      range.insertNode(oAt)
      setRangeAfterNode(oAt.firstChild!)

      open()
    }
  }

  const handleInput = async (e: Event) => {
    const { data, inputType } = e as InputEvent
    const {
      state: {
        filterValue,
        dropdownVisible,
        maxLength,
        formatter
      }
    } = _context
    const target = e.target as HTMLElement

    // 当 Mentions 列表被展开时，后续输入所有字符都当成过滤字符
    if (dropdownVisible) {
      if (inputType === 'deleteContentBackward') {
        if (filterValue) {
          _context.state.filterValue = filterValue.slice(0, -1)
        } else {
          close()
        }
      } else {
        _context.state.filterValue = !filterValue
          ? data ?? ''
          : `${filterValue}${data}`

        if (_context.state.currentOptions.length === 0) {
          close()
        }
      }
      return
    }

    const value = valueFormatter(target.innerHTML, formatter?.parser)

    // 输入达到最大值的时候还原输入框的值
    if (integerValidator(maxLength) && getValueLength(value) > maxLength) {
      _context.renderer.recordState(_context)
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

  const open = async () => {
    _context.state.dropdownVisible = true
    _context.emitter.emit('open')

    // 默认选中第一个 options
    const {
      state: {
        currentOptions,
        dropdownMaxWidth,
        dropdownMaxHeight
      },
      container
    } = _context
    if (currentOptions.length > 0) {
      _context.state.activeOptionIdx = 0
    }

    const oContrast = container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!
    const oDropdown = container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN}`)!

    const rect = computePosition(oContrast, oDropdown)

    Object.assign(oDropdown.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      maxWidth: `${typeof dropdownMaxWidth === 'number' ? dropdownMaxWidth : rect.availableWidth}px`,
      maxHeight: `${typeof dropdownMaxHeight === 'number' ? dropdownMaxHeight : rect.availableHeight}px`,
      width: `${rect.availableWidth}px`,
      height: `${rect.availableHeight}px`
    })

    // Keep the order of execution
    _context.renderer.fetchRemoteOptions(_context)
  }

  const close = () => {
    _context.state.filterValue = ''
    _context.state.dropdownVisible = false

    const { container, renderer } = _context

    const oAt = container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)

    if (oAt) {
      renderer.renderFailureAt(oAt, _context)
    }

    _context.emitter.emit('close')
  }

  const handleFocus = (e: Event) => {
    const target = e.target as HTMLElement
    target.classList.add(DOM_CLASSES.FOCUSED)
  }

  const handleBlur = (e: Event) => {
    const target = e.target as HTMLElement
    target.classList.remove(DOM_CLASSES.FOCUSED)
  }

  const handleDropdownListOptionMouseenter = (e: Event) => {
    const target = e.target as HTMLElement
    const { dropdownContainer } = _context

    const oList = dropdownContainer.firstElementChild as HTMLElement
    if (!oList || !target) {
      return
    }
    let index = 0
    ;[...oList.children as unknown as HTMLElement[]].some((child, idx) => {
      if (child.contains(target)) {
        index = idx
      }
    })

    _context.state.activeOptionIdx = index
  }

  const handleDropdownListOptionMousedown = (e: Event) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const { dropdownContainer } = _context

    const oList = dropdownContainer.firstElementChild as HTMLElement
    if (!oList || !target) {
      return
    }
    let index = 0
    ;[...oList.children as unknown as HTMLElement[]].some((child, idx) => {
      if (child.contains(target)) {
        index = idx
      }
    })

    _context.state.activeOptionIdx = index
    _context.renderer.appendMentionByIndex(_context)
  }

  const registerEvents = (context: Context) => {
    _context = context
    const { editor } = context

    editor.addEventListener('beforeinput', handleBeforeInput)
    editor.addEventListener('input', handleInput)
    editor.addEventListener('keydown', handleKeydown)
    editor.addEventListener('click', handleClick)
    editor.addEventListener('scroll', handleScroll)
    editor.addEventListener('mousedown', handleMousedown)
    editor.addEventListener('focus', handleFocus)
    editor.addEventListener('blur', handleBlur)
  }

  const cancelEvents = (_context: Context) => {}

  return {
    registerEvents,
    cancelEvents,
    handleDropdownListOptionMouseenter,
    handleDropdownListOptionMousedown,
    open,
    close
  }
}

export {
  createEventHandler
}
