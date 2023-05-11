import { DOM_CLASSES } from './config'
import { MentionDropdownListOption, createRenderer } from './libs/renderer'
import { mergeOptions } from './utils'

export interface Formatter {
  pattern: RegExp
  render: ((id: string, name: string) => string)
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
  getMentionLength: undefined | ((option: MentionDropdownListOption) => number)
  showStatistics: undefined | ((options: MentionDropdownListOption, currentMentions: MentionDropdownListOption[]) => string)
  formatter?: Formatter | null

  options?: MentionDropdownListOption[]
  labelFieldName?: string
  valueFieldName?: string
  optionsFetchApi: undefined | ((...args: any[]) => Promise<MentionDropdownListOption[]>)
  immediate?: boolean,
  filterOption?: (option: MentionDropdownListOption, filterValue: string) => boolean
  dropdownMaxWidth: number | undefined,
  dropdownMaxHeight: number | undefined
}

const createMentions = (opts?: MentionOptions) => {
  const options = mergeOptions(opts)

  console.log(options)
  const { createElement } = createRenderer(options)

  const oEditor = createElement('div', {
    class: `${DOM_CLASSES.INPUT}`,
    contenteditable: true
  })
  const oContainer = createElement('div', {
    class: DOM_CLASSES.CONTAINER
  }, [oEditor])

  return {
    mount (el: string | HTMLElement) {
      const root = typeof el === 'string'
        ? document.querySelector(el)
        : el

      root?.appendChild(oContainer)
    }
  }
}

export {
  createMentions
}
