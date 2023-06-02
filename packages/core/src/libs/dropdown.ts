import { DOM_CLASSES } from '../config'
import type { Context, MentionOptions } from '../mentions'
import { computePosition, isEmptyArray, isFunction } from '../utils'
import type { MentionDropdownListOption } from './renderer'

type Mode = 'multiple' | 'single'

interface DropdownState extends Pick<MentionOptions, 'immediate' | 'optionsFetchApi' | 'filterOption' | 'labelFieldName' | 'valueFieldName'> {
  filterValue: string
  selectedRowKeys: number[]
  options: MentionDropdownListOption[]
  localOptions: MentionDropdownListOption[]
  remoteOptions: MentionDropdownListOption[]
  loading: boolean
  currentOptions: MentionDropdownListOption[]
  switchMode?: 'mouse' | 'key'
  mode: Mode
  visible: boolean
}

const initDropdown = (context: Context, options: MentionOptions) => {
  let _filterValue = ''
  let _loading = false
  let _selectedRowKeys: number[] = []
  let _mode: Mode = 'single'

  const dropdownState: DropdownState = {
    visible: false,
    labelFieldName: 'name',
    valueFieldName: 'id',
    options: options.options ?? [],
    remoteOptions: [],
    immediate: options.immediate,
    switchMode: undefined,
    filterOption: options.filterOption,
    optionsFetchApi: options.optionsFetchApi,

    get mode () {
      return _mode
    },

    set mode (mode: Mode) {
      _mode = mode
      dropdownState.selectedRowKeys = []

      const { dropdownContainer } = context

      dropdownContainer.firstElementChild?.classList.toggle(DOM_CLASSES.DROPDOWN_MULTIPLE_MODE)

      const oBtnCancel = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_BTN_CANCEL}`)
      const oBtnMultiple = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_BTN_MULTIPLE}`)
      const parentNode = oBtnCancel?.parentNode

      if (parentNode) {
        parentNode.replaceChild(renderDropdownCancelButton(mode), oBtnCancel)
        parentNode.replaceChild(renderDropdownMultipleButton(mode), oBtnMultiple!)
      }
    },

    get filterValue () {
      return _filterValue
    },
    set filterValue (val: string) {
      _filterValue = val
      const { dropdownContainer } = context
      dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LOADING}`)?.remove()
      const oListWrapper = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LIST_WRAPPER}`)

      if (oListWrapper) {
        oListWrapper.innerHTML = ''
        oListWrapper.appendChild(
          this.currentOptions.length === 0
            ? renderDropdownEmpty()
            : renderMentionsList(context)
        )
      }
    },

    get loading () {
      return _loading
    },
    set loading (loading: boolean) {
      _loading = loading
      const { dropdownContainer } = context
      const oInput = dropdownContainer.querySelector<HTMLInputElement>(`.${DOM_CLASSES.DROPDOWN_FILTER_INPUT}`)

      if (!loading) {
        dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LOADING}`)?.remove()
        const oListWrapper = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_LIST_WRAPPER}`)

        if (oListWrapper) {
          oListWrapper.innerHTML = ''
          oListWrapper.appendChild(
            this.currentOptions.length === 0
              ? renderDropdownEmpty()
              : renderMentionsList(context)
          )
        }

        if (isEmptyArray(this.currentOptions)) {
          oInput?.setAttribute('disabled', 'disabled')
        } else {
          oInput?.removeAttribute('disabled')
          oInput?.focus()
        }
      }
    },

    get selectedRowKeys () {
      return _selectedRowKeys
    },
    set selectedRowKeys (keys: number[]) {
      _selectedRowKeys = keys

      const oOptions = context.dropdownContainer.querySelectorAll(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}`)
      oOptions.forEach((option, index) => {
        if (keys.includes(index)) {
          option.classList.add(DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE)
        } else {
          option.classList.remove(DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE)
        }
      })
    },

    get localOptions () {
      return (isFunction(this.optionsFetchApi) ? this.remoteOptions : this.options).map(option => ({
        ...option,
        name: option[this.labelFieldName as keyof MentionDropdownListOption] as string,
        id: option[this.valueFieldName as keyof MentionDropdownListOption] as string
      }))
    },

    get currentOptions () {
      if (!this.filterValue) {
        return this.localOptions
      }

      if (isFunction(this.filterOption)) {
        return this.localOptions.filter(option => (this.filterOption!)(option, this.filterValue))
      }
      return this.localOptions.filter(option => option.name.toLowerCase().includes(this.filterValue.toLowerCase()))
    }
  }

  const init = () => {
    if (isFunction(dropdownState.optionsFetchApi) && dropdownState.immediate) {
      fetchRemoteOptions()
    }
    initObserver()
  }

  const setOptions = (options: MentionDropdownListOption[]) => {
    dropdownState.options = options
  }

  // 展开
  const show = () => {
    // 每次打开都需要初始化数据
    Object.assign(dropdownState, {
      visible: true,
      filterValue: '',
      selectedRowKeys: [],
      mode: 'single'
    })

    const needFetch = isEmptyArray(dropdownState.currentOptions) &&
      isFunction(dropdownState.optionsFetchApi) &&
      !dropdownState.immediate

    if (needFetch) {
      fetchRemoteOptions()
    }
    renderDropdown()

    const { dropdownContainer } = context
    const oInput = dropdownContainer.querySelector<HTMLInputElement>(`.${DOM_CLASSES.DROPDOWN_FILTER_INPUT}`)
    oInput?.addEventListener('input', handleInput)

    dropdownContainer.addEventListener('mouseover', handleDropdownListOptionMouseover)
    dropdownContainer.addEventListener('mousedown', handleDropdownListOptionMousedown)
    document.addEventListener('keydown', handleKeydown)
    document.addEventListener('click', handleClick)

    if (!needFetch) {
      if (isEmptyArray(dropdownState.currentOptions)) {
        oInput?.setAttribute('disabled', 'disabled')
      } else {
        oInput?.removeAttribute('disabled')
        oInput?.focus()
        setTimeout(() => {
          oInput && (oInput.value = '')
        }, 0)
      }
    }

    const oContrast = context.container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!
    const oDropdown = context.container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_CONTAINER}`)!

    const rect = computePosition(oContrast, oDropdown)

    Object.assign(oDropdown.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      maxWidth: `${typeof options.dropdownMaxWidth === 'number' ? options.dropdownMaxWidth : rect.availableWidth}px`,
      maxHeight: `${typeof options.dropdownMaxHeight === 'number' ? options.dropdownMaxHeight : rect.availableHeight}px`,
      width: `${rect.availableWidth}px`,
      height: `${rect.availableHeight}px`
    })
  }

  const hide = (isClickEditor = false) => {
    const { dropdownContainer, container, renderer } = context

    dropdownContainer.innerHTML = ''

    dropdownContainer.removeEventListener('mouseover', handleDropdownListOptionMouseover)
    dropdownContainer.removeEventListener('mousedown', handleDropdownListOptionMousedown)
    document.removeEventListener('keydown', handleKeydown)

    const oInput = dropdownContainer.querySelector<HTMLInputElement>(`.${DOM_CLASSES.DROPDOWN_FILTER_INPUT}`)
    oInput?.removeEventListener('input', handleInput)
    dropdownState.visible = false

    // 清理 At 块
    const oAt = container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)
    if (oAt) {
      if (!isClickEditor) {
        const selection = window.getSelection()!
        const range = new Range()
        range.setStartAfter(oAt.firstChild!)
        range.setEndAfter(oAt.firstChild!)
        // range.deleteContents()
        selection.removeAllRanges()
        selection.addRange(range)
      }
      // context.renderer.restoreState(context)
      renderer.renderFailureAt(oAt, context)
    }
  }

  const submit = () => {
    const { selectedRowKeys, currentOptions } = dropdownState
    if (!isEmptyArray(selectedRowKeys)) {
      context.renderer.appendMentions(context, currentOptions.filter((_, idx) => selectedRowKeys.includes(idx)))
    }
  }

  const fetchRemoteOptions = async () => {
    const {
      optionsFetchApi,
      immediate,
      remoteOptions
    } = dropdownState

    if (
      isFunction(optionsFetchApi) &&
      !immediate &&
      remoteOptions.length === 0
    ) {
      dropdownState.loading = true
      dropdownState.remoteOptions = await optionsFetchApi!()

      dropdownState.loading = false
    }
  }

  const renderDropdown = () => {
    const {
      dropdownContainer,
      renderer: {
        createElement
      }
    } = context

    const {
      currentOptions,
      loading
    } = dropdownState

    dropdownContainer.appendChild(createElement('div', {
      class: DOM_CLASSES.DROPDOWN_CONTAINER
    }, [
      renderDropdownHeader(),
      createElement('div', {
        class: DOM_CLASSES.DROPDOWN_LIST_WRAPPER
      }, [
        isEmptyArray(currentOptions)
          ? renderDropdownEmpty()
          : renderMentionsList(context),
        ...(loading ? [renderDropdownLoading()] : [])
      ])
    ]))
  }

  const renderDropdownEmpty = () => {
    return context.renderer.createElement('div', {
      class: DOM_CLASSES.DROPDOWN_EMPTY
    }, [
      renderDropdownEmptyGraph(),
      '暂无数据'
    ])
  }

  const renderDropdownLoading = () => {
    const oLoading = context.renderer.createElement('div', {
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
      renderer: {
        createElement
      },
      container
    } = context
    const {
      currentOptions,
      selectedRowKeys
    } = dropdownState

    const oList = createElement('ul', {
      class: DOM_CLASSES.DROPDOWN_LIST
    }, currentOptions.map((option, index) => (
      createElement('li', {
        class: `${DOM_CLASSES.DROPDOWN_LIST_OPTION} ${selectedRowKeys.includes(index)
          ? DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE
          : ''
        } ${option.disabled ? DOM_CLASSES.DROPDOWN_LIST_OPTION_DISABLED : ''}`,
        'data-id': option.id,
        'data-name': option.name
      }, [
        createElement('span', {
          class: DOM_CLASSES.DROPDOWN_CHECKBOX
        }),
        typeof option.customRender === 'function' ? option.customRender(option, index) : option.name
      ])
    )))
    setTimeout(() => {
      const oContrast = container.querySelector<HTMLElement>(`.${DOM_CLASSES.AT}`)!
      const oDropdown = container.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_CONTAINER}`)!
      oDropdown.style.cssText = ''
      const rect = computePosition(oContrast, oDropdown)

      Object.assign(oDropdown.style, {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        maxWidth: `${typeof options.dropdownMaxWidth === 'number' ? options.dropdownMaxWidth : rect.availableWidth}px`,
        maxHeight: `${typeof options.dropdownMaxHeight === 'number' ? options.dropdownMaxHeight : rect.availableHeight}px`,
        width: `${rect.availableWidth}px`,
        height: `${rect.availableHeight}px`
      })
    })
    return oList
  }

  const renderDropdownCancelButton = (mode: Mode = 'single') => {
    const oBtn = context.renderer.createElement('button', {
      class: DOM_CLASSES.DROPDOWN_BTN_CANCEL
    })
    if (mode === 'single') {
      oBtn.innerHTML = '<svg focusable="false" data-icon="close-circle" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="64 64 896 896"><path d="M685.4 354.8c0-4.4-3.6-8-8-8l-66 .3L512 465.6l-99.3-118.4-66.1-.3c-4.4 0-8 3.5-8 8 0 1.9.7 3.7 1.9 5.2l130.1 155L340.5 670a8.32 8.32 0 00-1.9 5.2c0 4.4 3.6 8 8 8l66.1-.3L512 564.4l99.3 118.4 66 .3c4.4 0 8-3.5 8-8 0-1.9-.7-3.7-1.9-5.2L553.5 515l130.1-155c1.2-1.4 1.8-3.3 1.8-5.2z"></path><path d="M512 65C264.6 65 64 265.6 64 513s200.6 448 448 448 448-200.6 448-448S759.4 65 512 65zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path></svg>'
    } else {
      oBtn.innerHTML = '取消'
    }
    return oBtn
  }
  const renderDropdownMultipleButton = (mode: Mode = 'single') => {
    return context.renderer.createElement('button', {
      class: DOM_CLASSES.DROPDOWN_BTN_MULTIPLE
    }, [mode === 'single' ? '多选' : '完成'])
  }

  const renderDropdownHeader = () => {
    const {
      renderer: {
        createElement
      }
    } = context
    return createElement('header', {
      class: DOM_CLASSES.DROPDOWN_HEADER
    }, [
      renderDropdownCancelButton(),
      createElement('input', {
        class: DOM_CLASSES.DROPDOWN_FILTER_INPUT,
        placeholder: '搜索要提及的人'
      }),
      renderDropdownMultipleButton()
    ])
  }

  const initObserver = () => {
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

      if (intersectionRatio === 1 || dropdownState.switchMode === 'mouse') {
        return
      }

      const optionHeight = oActive.getBoundingClientRect().height
      const paddingTop = parseInt(window.getComputedStyle(oList).paddingTop)
      oList.scrollTop = dropdownState.selectedRowKeys[0] * optionHeight + (isNaN(paddingTop) ? 0 : paddingTop)
    })
  }

  const switchActiveOption = (key: string) => {
    const { currentOptions, selectedRowKeys } = dropdownState
    const len = currentOptions.length
    if (len === 0) {
      return
    }

    if (isEmptyArray(selectedRowKeys)) {
      dropdownState.selectedRowKeys = key === 'ArrowDown'
        ? [0]
        : [len - 1]
      return
    }

    if (selectedRowKeys[0] === len - 1 && key === 'ArrowDown') {
      dropdownState.selectedRowKeys = [0]
      return
    }
    if (selectedRowKeys[0] === 0 && key === 'ArrowUp') {
      dropdownState.selectedRowKeys = [len - 1]
      return
    }
    dropdownState.selectedRowKeys = key === 'ArrowDown'
      ? [selectedRowKeys[0] + 1]
      : [selectedRowKeys[0] - 1]
  }

  const handleDropdownListOptionMouseover = (e: Event) => {
    const target = e.target as HTMLElement
    const { dropdownContainer } = context
    const { currentOptions } = dropdownState

    const oList = dropdownContainer?.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST}`)
    if (!oList || !target || !oList.contains(target) || dropdownState.mode === 'multiple') {
      return
    }
    let index = 0
    ;[...oList.children as unknown as HTMLElement[]].some((child, idx) => {
      if (currentOptions[idx].disabled) {
        return false
      }
      if (child.contains(target)) {
        index = idx
        return true
      }

      return false
    })
    dropdownState.switchMode = 'mouse'
    dropdownState.selectedRowKeys = [index]
  }

  const handleDropdownListOptionMousedown = (e: Event) => {
    e.preventDefault()
    const target = e.target as HTMLElement
    const { dropdownContainer } = context
    const { currentOptions, mode, selectedRowKeys } = dropdownState
    let keys: number[] = [...selectedRowKeys]

    const oList = dropdownContainer?.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST}`)
    if (!oList || !target || !oList.contains(target)) {
      return
    }

    [...oList.children as unknown as HTMLElement[]].some((child, idx) => {
      if (currentOptions[idx].disabled) {
        return false
      }
      if (child.contains(target)) {
        if (mode === 'single') {
          keys = [idx]
        } else if (keys.includes(idx)) {
          keys = keys.filter(key => key !== idx)
        } else {
          keys.push(idx)
        }
        return true
      }
      return false
    })

    dropdownState.switchMode = 'mouse'
    dropdownState.selectedRowKeys = keys
    if (dropdownState.mode === 'single') {
      submit()
    }
  }

  const handleKeydown = (e: KeyboardEvent) => {
    const { key } = e
    if (['ArrowDown', 'ArrowUp'].includes(key)) {
      e.preventDefault()
      dropdownState.switchMode = 'key'
      if (dropdownState.mode === 'single') {
        switchActiveOption(key)
      }
    } else if (key === 'Enter') {
      e.preventDefault()
      submit()
    }
  }

  const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement

    dropdownState.filterValue = target.value
  }

  const handleClick = (e: MouseEvent) => {
    const target = e.target as Element
    const { dropdownContainer } = context
    const { mode } = dropdownState
    const oBtnCancel = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_BTN_CANCEL}`)

    if (oBtnCancel?.contains(target)) {
      if (mode === 'single') {
        hide()
      } else {
        dropdownState.mode = 'single'
      }
      return
    }

    const oBtnMultiple = dropdownContainer.querySelector<HTMLElement>(`.${DOM_CLASSES.DROPDOWN_BTN_MULTIPLE}`)

    if (oBtnMultiple?.contains(target)) {
      if (mode === 'multiple') {
        submit()
      } else {
        dropdownState.mode = 'multiple'
      }
    }
  }

  init()

  return {
    show,
    hide,
    setOptions,
    get visible () {
      return dropdownState.visible
    }
  }
}

export { initDropdown }
