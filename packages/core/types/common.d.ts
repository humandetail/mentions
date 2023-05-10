import type { VNode } from 'vue'

export interface MentionOption extends Record<string, any> {
  label: string
  value: string
}

export interface Formatter {
  pattern: RegExp
  render: ((id: string, name: string) => VNode | string) | { scopedSlot: string }
  parser: (id: string, name: string) => string
}

export interface ComponentProps {
  type?: 'input' | 'textarea'
  value?: string
  initialValue?: string
  prefix?: string
  suffix?: string
  maxLength?: number
  getMentionLength?: Function
  showStatistics?: Function
  formatter?: Formatter

  options?: MentionOption[]
  labelFieldName?: string
  valueFieldName?: string
  optionsFetchApi: (...args: any[]) => Promise<MentionOption[]>
  immediate?: boolean,
  loading?: boolean,
  filterOption?: (option: MentionOption, filterValue: string) => boolean
  dropdownMaxWidth?: number,
  dropdownMaxHeight?: number
}
