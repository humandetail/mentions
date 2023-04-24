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
