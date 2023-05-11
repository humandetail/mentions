export const createElement = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  props: null | Record<string, string>,
  childrens: Array<string | Text | HTMLElement> = []
) => {
  if (!tagName || !childrens?.[0]) {
    throw new TypeError(`"tagName" expect a HTMLElementTagName, but got "${tagName}"`)
  }

  if (!tagName) {
    return document.createTextNode(childrens[0] as string)
  }

  const el = document.createElement(tagName)

  if (props != null) {
    Object.entries(props).forEach(([key, value]) => {
      el.setAttribute(key, value)
    })
  }

  childrens?.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })

  return el
}
