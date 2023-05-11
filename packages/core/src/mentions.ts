import { DOM_CLASSES } from './libs/config'
import { createElement } from './libs/renderer'
import { ComponentProps } from './types/mentions'

const createMentions = (options?: ComponentProps) => {
  console.log(options)
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
