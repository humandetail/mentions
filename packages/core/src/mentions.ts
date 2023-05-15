import EventEmitter from './libs/EventEmitter'
import { DOM_CLASSES } from './config'
import { createEventHandler } from './libs/eventHandler'
import { MentionDropdownListOption, createRenderer } from './libs/renderer'
import { HTMLString, MentionConstructor } from './types'
import { getValueLength } from './utils'
import { mergeOptions } from './utils'

export interface Formatter {
  pattern: RegExp
  render: ((id: string, name: string) => HTMLString)
  parser: (id: string, name: string) => string
}
export interface MentionOptions {
  type?: 'input' | 'textarea'
  value?: string
  initialValue?: string
  disabled?: boolean
  readonly?: boolean
  prefix?: string
  suffix?: string
  maxLength?: number
  getMentionLength?: null | ((option: MentionDropdownListOption) => number)
  showStatistics?: null | ((options: MentionDropdownListOption, currentMentions: MentionDropdownListOption[]) => string)
  formatter?: Formatter | null

  options?: MentionDropdownListOption[]
  labelFieldName?: string
  valueFieldName?: string
  optionsFetchApi?: null | ((...args: any[]) => Promise<MentionDropdownListOption[]>)
  immediate?: boolean,
  filterOption?: (option: MentionDropdownListOption, filterValue: string) => boolean
  dropdownMaxWidth?: number | null,
  dropdownMaxHeight?: number | null
}

export interface Record {
  innerHTML: HTMLString
  anchorNodeIdx: number
  anchorOffset: number
  focusNodeIdx: number
  focusOffset: number
}

export interface State extends Required<MentionOptions> {
  value: string
  get valueLength (): number
  record: Record
  switchKey?: string

  dropdownVisible: boolean
  activeOptionIdx: number
  filterValue: string
  remoteOptions: MentionDropdownListOption[]
  fetchLoading: boolean
  get localOptions (): MentionDropdownListOption[]
  get currentOptions (): MentionDropdownListOption[]

  currentMentions: MentionDropdownListOption[]
}

export interface Context {
  state: State
  renderer: ReturnType<typeof createRenderer>
  eventHandler: ReturnType<typeof createEventHandler>
  container: HTMLElement
  editor: HTMLElement
  dropdownContainer: HTMLElement
  intersectionObserver: null | IntersectionObserver
  emitter: EventEmitter
}

export const createRecord = (
  innerHTML: HTMLString,
  anchorNodeIdx: number,
  anchorOffset: number,
  focusNodeIdx: number,
  focusOffset: number
) => ({
  innerHTML,
  anchorNodeIdx,
  anchorOffset,
  focusNodeIdx,
  focusOffset
})

const createState = (options: Required<MentionOptions>): State => {
  let fetchLoading = false
  let activeOptionIdx = -1
  let filterValue = ''

  return {
    ...options,
    value: options.value || options.initialValue || '',
    get valueLength () {
      return getValueLength(this.value, options.formatter?.pattern, options.getMentionLength)
    },

    dropdownVisible: false,
    get activeOptionIdx () {
      return activeOptionIdx
    },
    set activeOptionIdx (idx) {
      activeOptionIdx = idx
    },
    get filterValue () {
      return filterValue
    },
    set filterValue (value) {
      filterValue = value
    },
    remoteOptions: [],
    get fetchLoading () {
      return fetchLoading
    },
    set fetchLoading (loading) {
      fetchLoading = loading
    },
    get localOptions () {
      const { optionsFetchApi, options, remoteOptions, labelFieldName, valueFieldName } = this

      return (typeof optionsFetchApi === 'function' ? remoteOptions : options).map(option => ({
        ...option,
        name: option[labelFieldName as keyof MentionDropdownListOption] as string,
        id: option[valueFieldName as keyof MentionDropdownListOption] as string
      }))
    },

    get currentOptions () {
      const { localOptions, filterValue, filterOption } = this
      if (!filterValue) {
        return localOptions
      }

      if (typeof filterOption === 'function') {
        return localOptions.filter(option => filterOption(option, filterValue))
      }
      return localOptions.filter(option => option.name.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0)
    },

    record: createRecord('', -1, -1, -1, -1),
    switchKey: undefined,

    currentMentions: []
  }
}

const createMentions = (opts?: MentionOptions): MentionConstructor => {
  const options = mergeOptions(opts)

  const renderer = createRenderer(options)
  const eventHandler = createEventHandler()

  const oEditor = renderer.createElement('div', { class: `${DOM_CLASSES.INPUT}`, contenteditable: true })
  const oDropdownContainer = renderer.createElement('div', null)
  const oContainer = renderer.createElement('div', { class: DOM_CLASSES.CONTAINER }, [oEditor, oDropdownContainer])
  oEditor.innerHTML = renderer.formatContent(options.value)

  const context: Context = {
    state: createState(options),
    renderer: createRenderer(options),
    eventHandler,
    container: oContainer,
    editor: oEditor,
    dropdownContainer: oDropdownContainer,
    intersectionObserver: null,
    emitter: new EventEmitter()
  }

  // 请不要在使用时解构 state，这样会丢失响应性
  context.state = new Proxy(context.state, {
    set (t, k, v, r) {
      const res = Reflect.set(t, k, v, r)
      if (['dropdownVisible', 'fetchLoading', 'activeOptionIdx', 'filterValue'].includes(k as string)) {
        context.renderer.activateDropdown(context, k as string)
      }
      if (k === 'activeOptionIdx') {
        if (t.dropdownVisible && context.intersectionObserver) {
          document.body.offsetHeight
          context.intersectionObserver.observe(document.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`)!)
        }
      }
      return res
    }
  })

  const mentionsConstructor: MentionConstructor = {
    mount (el: string | HTMLElement) {
      const root = typeof el === 'string'
        ? document.querySelector(el)
        : el

      root?.appendChild(oContainer)
      // 注册相关事件
      eventHandler.registerEvents(context)
      renderer.initObserver(context)
    },

    destroy () {
      oContainer.remove()
      eventHandler.cancelEvents(context)
    },

    on: (type, cb) => {
      context.emitter.on(type, cb)
      return mentionsConstructor
    },
    once: (type, cb) => {
      context.emitter.once(type, cb)
      return mentionsConstructor
    },
    off: (type, cb) => {
      context.emitter.off(type, cb)
      return mentionsConstructor
    },
    clear: () => {
      context.emitter.clear()
      return mentionsConstructor
    }
  }

  return mentionsConstructor
}

export {
  createMentions
}
