// @ts-nocheck
import { DOM_CLASSES, MENTION_REG } from '../libs/config'

export default {
  methods: {
    formatContent (val) {
      const content = []

      while (val.length) {
        const match = val.match(MENTION_REG)
        if (match) {
          const option = {
            label: match[1],
            value: match[2]
          }
          content.push(option)
          this.currentMentions.push(option)
          val = val.slice(match[0].length)
        } else {
          const lastVal = typeof content.at(-1) === 'string'
            ? content.pop()
            : ''

          content.push(`${lastVal}${val[0]}`)
          val = val.slice(1)
        }
      }

      return content
    },

    renderContent (content) {
      const { prefix, suffix } = this
      const oEditor = this.$refs.Editor
      if (!oEditor) {
        return
      }

      oEditor.innerHTML = content.reduce((html, item) => {
        if (typeof item === 'string') {
          if (this.type === 'input') {
            return `${html}${item}`
          }
          return `${html}${item.split('\n').map((v, i) => (i !== 0 ? `<br />${v}` : v))}`
        }

        return `${html}<em class="${DOM_CLASSES.MENTION}" data-id="${item.value}" data-name="${item.label}" contenteditable="false">${prefix}${item.label}${suffix}</em>`
      }, '')
    }
  }
}
