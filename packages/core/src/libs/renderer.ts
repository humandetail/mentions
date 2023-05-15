import { DOM_CLASSES, MENTION_REG } from '../config'
import { Context, MentionOptions } from '../mentions'
import { computeMentionLength, createMentionElement, getValueLength, insertNodeAfterRange, integerValidator, isEmptyTextNode, valueFormatter } from '../utils'

export interface MentionDropdownListOption {
  name: string
  id: string
  disabled?: boolean
  customRender?: (option: MentionDropdownListOption, index: number) => string
}

const createRenderer = (options: Required<MentionOptions>) => {
  function createElement<T extends null = null>(tagName: T, props: null, children: Array<string | Text | HTMLElement | DocumentFragment>): Text
  function createElement<T extends (keyof HTMLElementTagNameMap)>(tagName: T, props: null | Record<string, any>, children?: Array<string | Text | HTMLElement | DocumentFragment>): HTMLElementTagNameMap[T]
  function createElement<T extends (keyof HTMLElementTagNameMap) | null>(
    tagName: null | T,
    props: null | Record<string, any>,
    children: Array<string | Text | HTMLElement | DocumentFragment> = []
  ) {
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

    const reg = formatter?.pattern || MENTION_REG

    return val.replace(/\n/g, '<br />').replace(reg, (_, name, id) => {
      return `<em
        class="${DOM_CLASSES.MENTION}"
        data-id=${id}"
        data-name="${name}"
        contenteditable="${false}"
      >${ renderMentionContent(id, name) }</em>`
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
    const childNodes = [...editor.childNodes as any]
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

    const anchorNodeIsEditor = anchorNode === editor
    const focusNodeIsEditor = focusNode === editor

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

  // 激活 dropdown 下列列表
  const activateDropdown = (context: Context, key: string) => {
    const {
      state: {
        dropdownVisible,
        fetchLoading,
        activeOptionIdx,
        // filterValue,
        currentOptions
      },
      dropdownContainer
    } = context

    if (!dropdownVisible) {
      dropdownContainer.innerHTML = ''
      return
    }

    let oDropdown = dropdownContainer.firstElementChild as HTMLElement

    if (!oDropdown?.classList.contains(DOM_CLASSES.DROPDOWN)) {
      renderDropdown(context)
      oDropdown = dropdownContainer.firstElementChild as HTMLElement
    }

    if (fetchLoading) {
      oDropdown.appendChild(renderDropdownLoading())
    } else {
      oDropdown.innerHTML = ''
      // oDropdown.querySelector(`.${DOM_CLASSES.DROPDOWN_LOADING}`)?.remove()
      oDropdown.appendChild(
        currentOptions.length === 0
          ? renderDropdownEmpty()
          : renderMentionsList(context)
      )
    }

    switch (key) {
      case 'filterValue':
        oDropdown.innerHTML = ''
        oDropdown.appendChild(
          currentOptions.length === 0
            ? renderDropdownEmpty()
            : renderMentionsList(context)
        )
        break
      case 'activeOptionIdx':
        const oOptions = oDropdown.querySelectorAll(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}`)
        oOptions.forEach(option => {
          option.classList.remove(DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE)
        })
        oOptions[activeOptionIdx].classList.add(DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE)
        break
      default:
        break
    }
  }

  const renderDropdown = (context: Context) => {
    const {
      state: {
        currentOptions,
        fetchLoading
      },
      dropdownContainer
    } = context

    dropdownContainer.appendChild(createElement('div', {
      class: DOM_CLASSES.DROPDOWN,
    },[
      currentOptions.length === 0
        ? renderDropdownEmpty()
        : renderMentionsList(context),
      ...(fetchLoading ? [renderDropdownLoading()] : [])
    ]))
  }

  const renderDropdownEmpty = () => {
    return createElement('div', {
      class: DOM_CLASSES.DROPDOWN_EMPTY
    }, [
      renderDropdownEmptyGraph(),
      '暂无数据'
    ])
  }

  const renderDropdownLoading = () => {
    const oLoading = createElement('div', {
      class: DOM_CLASSES.DROPDOWN_LOADING
    })
    oLoading.innerHTML = `<svg focusable="false" class="${DOM_CLASSES.DROPDOWN_LOADING_SPIN}" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg>`
    return oLoading
  }

  const renderDropdownEmptyGraph = (width = 48, height = 31) => {
    return new Range().createContextualFragment(`<svg width="${width}" height="${height}" viewBox="0 0 64 41"><g transform="translate(0 1)" fill="none" fill-rule="evenodd"><ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse><g fill-rule="nonzero" stroke="#D9D9D9"><path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path><path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#FAFAFA"></path></g></g></svg>`)
  }

  const renderMentionsList = (context: Context) => {
    const {
      state: {
        currentOptions,
        activeOptionIdx
      }
    } = context

    const oList = createElement('ul', {
      class: DOM_CLASSES.DROPDOWN_LIST
    }, currentOptions.map((option, index) => (
      createElement('li', {
        class: `${DOM_CLASSES.DROPDOWN_LIST_OPTION} ${activeOptionIdx === index
          ? DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE
          : ''
        } ${option.disabled ? DOM_CLASSES.DROPDOWN_LIST_OPTION_DISABLED : ''}`,
        'data-id': option.id,
        'data-name': option.name
      }, [
        typeof option.customRender === 'function' ? option.customRender(option, index) : option.name
      ])
    )))

    oList.addEventListener('mouseenter', context.eventHandler.handleDropdownListOptionMouseenter)
    oList.addEventListener('mousedown', context.eventHandler.handleDropdownListOptionMousedown)
    return oList
    // onMouseenter={ () => this.handleDropdownListOptionMouseenter(index) }
    // onMousedown={ e => this.handleDropdownListOptionMousedown(index, e) }
  }

  const initObserver = (context: Context) => {
    context.intersectionObserver = new IntersectionObserver(entries => {
      const { intersectionRatio } = entries[0]

      const oList = context.container.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST}`)

      if (!oList) {
        return
      }

      const oActive = oList.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`)
      if (!oActive) {
        return
      }
      context.intersectionObserver?.unobserve(oActive)

      if (intersectionRatio === 1) {
        return
      }

      const optionHeight = oActive.getBoundingClientRect().height
      const paddingTop = parseInt(window.getComputedStyle(oList).paddingTop)
      oList.scrollTop = context.state.activeOptionIdx * optionHeight + (isNaN(paddingTop) ? 0 : paddingTop) // +4 padding-top
    })
  }

  const switchActiveOption = (context: Context) => {
    const { state: { currentOptions, activeOptionIdx, switchKey } } = context
    const len = currentOptions.length
    if (len === 0) {
      return
    }

    if (activeOptionIdx === -1) {
      context.state.activeOptionIdx = switchKey === 'ArrowDown'
        ? 0
        : len - 1
      return
    }

    if (activeOptionIdx === len - 1 && switchKey === 'ArrowDown') {
      context.state.activeOptionIdx = 0
      return
    }
    if (activeOptionIdx === 0 && switchKey === 'ArrowUp') {
      context.state.activeOptionIdx = len - 1
      return
    }
    context.state.activeOptionIdx = switchKey === 'ArrowDown'
      ? activeOptionIdx + 1
      : activeOptionIdx - 1
  }

  const appendMentionByIndex = (context: Context) => {
    const {
      state: {
        currentOptions,
        prefix,
        suffix,
        value,
        maxLength,
        activeOptionIdx
      },
      container,
      editor
    } = context

    const item = currentOptions[activeOptionIdx]

    // 1. 清除输入内容
    const range = new Range()
    range.selectNode(container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!)
    range.deleteContents()

    const oActiveMention = container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`)!

    if (!oActiveMention.classList.contains(DOM_CLASSES.DROPDOWN_LIST_OPTION_DISABLED)) {
      // 2. 插入 @Mention 内容块并让光标位置插入块之后
      const oM = createMentionElement(item.name, item.id, prefix, suffix)

      if (!(integerValidator(maxLength) && getValueLength(value) + computeMentionLength(item, context.state.getMentionLength) > maxLength)) {
        // 只允许在剩余长度足够的情况下插入 mention
        insertNodeAfterRange(oM)
      }
    }

    // 3. 关闭 dropdown
    context.eventHandler.close()

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

    const reg = formatter?.pattern || MENTION_REG

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

  const fetchRemoteOptions = async  (context: Context) => {
    const {
      optionsFetchApi,
      immediate,
      remoteOptions
    } = context.state

    if (
      typeof optionsFetchApi === 'function' &&
      !immediate &&
      remoteOptions.length === 0
    ) {
      context.state.fetchLoading = true
      context.state.remoteOptions = await optionsFetchApi().finally(() => {
        context.state.fetchLoading = false
      })

      if (context.state.dropdownVisible) {
        const oDropdown = context.container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN}`)!
        oDropdown.style.cssText = ''
        context.eventHandler.open()
      }
    }
  }

  return {
    createElement,
    formatContent,
    renderMentionContent,
    renderFailureAt,
    activateDropdown,
    appendMentionByIndex,
    initObserver,
    switchActiveOption,
    getMentionsByValueChange,
    recordState,
    restoreState,
    fetchRemoteOptions
  }
}

export {
  createRenderer
}
