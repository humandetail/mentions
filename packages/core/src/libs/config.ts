import { type DomClassesType } from '../types/common'

const prefix = 'vanilla-mentions__'

export const DOM_CLASSES = (() => {
  const arr = [
    'container',
    'at',
    'input',
    'mention',
    'dropdown',
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

export function integerValidator (value: number) {
  return !Number.isNaN(value) && value >= 0
}

export const MENTION_REG = /^#{name:([\w\W]+?),id:([\w\W]+?)}/

export const MENTION_DOM_REG = /<\s*em[^>]*class="[^"]*mention[^"]*"[^>]*data-id="([^"]*)"[^>]*data-name="([^"]*)"[^>]*>[\w\W]*?<\/\s*em\s*>/gi

export const HTML_ENTITY_CHARACTER_REG = /&[A-z]+;/i
