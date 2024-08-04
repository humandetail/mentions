import type { MentionDropdownListOption } from '../libs/renderer'
import type { MentionOptions } from '../mentions'
import type { DomClassesType } from '../types'

const prefix = 'vanilla-mentions__'

export const initialOptions: Required<MentionOptions> = {
  type: 'input',
  value: '',
  initialValue: '',
  disabled: false,
  readonly: false,
  prefix: '@',
  suffix: ' ',
  maxLength: 0,
  getMentionLength: null,
  showStatistics: null,
  formatter: null,
  options: [],
  labelFieldName: 'value',
  valueFieldName: 'key',
  optionsFetchApi: null,
  immediate: false,
  filterOption: (option: MentionDropdownListOption, filterValue: string) => option.value.toLowerCase().includes(filterValue.toLowerCase()),
  dropdownMaxWidth: null,
  dropdownMaxHeight: 200
}

export const DOM_CLASSES = (() => {
  const arr = [
    'container',
    'at',
    'input',
    'mention',
    'dropdown',
    'dropdown-container',
    'dropdown-multiple-mode',
    'dropdown-header',
    'dropdown-btn-cancel',
    'dropdown-btn-multiple',
    'dropdown-filter-input',
    'dropdown-list-wrapper',
    'dropdown-checkbox',
    'dropdown-checkbox-checked',
    'dropdown-list',
    'dropdown-list-option',
    'dropdown-list-option-active',
    'dropdown-list-option-disabled',
    'dropdown-arrow',
    'dropdown-empty',
    'dropdown-loading',
    'dropdown-loading-spin',
    'focused',
    'disabled',
    'readonly'
  ] as const

  return arr.reduce((obj, item: string) => {
    return {
      ...obj,
      [item.toUpperCase().replace(/-/g, '_')]: `${prefix}${item}`
    }
  }, {} as DomClassesType<typeof arr>)
})()

// https://cdn.staticaly.com/gh/w3c/input-events/v1/index.html#overview
// https://rawgit.com/w3c/input-events/v1/index.html#interface-InputEvent-Attributes
export const INSERT_TEXT_TYPE = [
  'insertText',
  'insertReplacementText',
  'insertLineBreak',
  'insertParagraph',
  'insertOrderedList',
  'insertUnorderedList',
  'insertHorizontalRule',
  'insertFromYank',
  'insertFromDrop',
  'insertFromPaste',
  'insertFromPasteAsQuotation',
  'insertTranspose',
  'insertCompositionText',
  'insertLink'
]

export const MENTION_REG = /#{value:([^}]+?),key:([^}]+?)}/g

export const MENTION_DOM_REG = /<\s*em[^>]*class="[^"]*mention[^"]*"[^>]*data-key="([^"]*)"[^>]*data-name="([^"]*)"[^>]*>[\w\W]*?<\/\s*em\s*>/gi

export const HTML_ENTITY_CHARACTER_REG = /&[A-z]+;/i
