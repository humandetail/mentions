export const createElement = <T extends keyof HTMLElementTagNameMap>(
  tagName: T,
  props: null | Record<string, string>,
  children: Array<string | Text | HTMLElement> = []
) => {
  if (!tagName || !children?.[0]) {
    throw new TypeError(`"tagName" expect a HTMLElementTagName, but got "${tagName}"`)
  }

  if (!tagName) {
    return document.createTextNode(children[0] as string)
  }

  const el = document.createElement(tagName)

  if (props != null) {
    Object.entries(props).forEach(([key, value]) => {
      el.setAttribute(key, value)
    })
  }

  children?.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child))
    } else {
      el.appendChild(child)
    }
  })

  return el
}
