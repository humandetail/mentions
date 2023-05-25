import EventEmitter from './libs/EventEmitter'
import { DOM_CLASSES } from './config'
import { createEventHandler } from './libs/eventHandler'
import { type MentionDropdownListOption, createRenderer } from './libs/renderer'
import type { HTMLString, MentionConstructor } from './types'
import { getValueLength, mergeOptions } from './utils'
import { initDropdown } from './libs/dropdown'
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
  optionsFetchApi?: null | ((...args: unknown[]) => Promise<MentionDropdownListOption[]>)
  immediate?: boolean
  filterOption?: (option: MentionDropdownListOption, filterValue: string) => boolean
  dropdownMaxWidth?: number | null
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

  currentMentions: MentionDropdownListOption[]
}

export interface Context {
  state: State
  renderer: ReturnType<typeof createRenderer>
  eventHandler: ReturnType<typeof createEventHandler>
  dropdown?: ReturnType<typeof initDropdown>
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
  return {
    ...options,
    value: options.value || options.initialValue || '',
    get valueLength () {
      return getValueLength(this.value, options.formatter?.pattern, options.getMentionLength)
    },

    record: createRecord('', -1, -1, -1, -1),

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

  context.dropdown = initDropdown(context, options)

  const mentionsConstructor: MentionConstructor = {
    mount (el: string | HTMLElement) {
      const root = typeof el === 'string'
        ? document.querySelector(el)
        : el

      root?.appendChild(oContainer)

      // 触发首次 value change 事件
      context.renderer.handleValueChange(context, context.state.value, true)

      // 注册相关事件
      eventHandler.registerEvents(context)
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
