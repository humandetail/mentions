export interface MentionOption extends Record<string, unknown> {
  label: string
  value: string
  disabled?: boolean
  customRender?: (option: MentionOption, index: number) => string
}

export interface Formatter {
  pattern: RegExp
  render: ((id: string, name: string) => string)
  parser: (id: string, name: string) => string
}

export interface ComponentProps {
  type?: 'input' | 'textarea'
  value?: string
  initialValue?: string
  disabled?: boolean
  readonly?: boolean
  prefix?: string
  suffix?: string
  maxLength?: number
  getMentionLength?: () => number
  showStatistics?: () => string
  formatter?: Formatter

  options?: MentionOption[]
  labelFieldName?: string
  valueFieldName?: string
  optionsFetchApi: (...args: unknown[]) => Promise<MentionOption[]>
  immediate?: boolean
  loading?: boolean
  filterOption?: (option: MentionOption, filterValue: string) => boolean
  dropdownMaxWidth?: number
  dropdownMaxHeight?: number
}
