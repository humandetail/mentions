const prefix = 'vue-mentions__'

export const DOM_CLASSES = (() => {
  const arr: string[] = [
    'container',
    'at',
    'input',
    'mention',
    'dropdown',
    'dropdown-list',
    'dropdown-list-option',
    'dropdown-arrow',
    'dropdown-empty'
  ]
  return arr.reduce((obj: Record<string, string>, item: string) => {
    return {
      ...obj,
      [item.toUpperCase().replace(/-/g, '_')]: `${prefix}${item}`
    }
  }, {})
})()

export function integerValidator (value: number) {
  return !Number.isNaN(value) && value >= 0
}

export const MENTION_REG = /^#{name:([\w\W]+?),id:([\w\W]+?)}/

export const MENTION_DOM_REG = /<\s*em[^>]*class="[^"]*mention[^"]*"[^>]*data-id="([^"]*)"[^>]*data-name="([^"]*)"[^>]*>[^<]*<\/\s*em\s*>/gi
