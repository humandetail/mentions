// @ts-nocheck
import { MENTION_REG } from '../libs/config'

export default {
  methods: {
    formatContent (val) {
      const { formatter } = this
      const content = []

      const reg = formatter?.pattern || MENTION_REG

      while (val.length) {
        const match = val.match(reg)
        if (match) {
          const option = {
            label: match[1],
            value: match[2]
          }
          content.push(option)
          this.currentMentions.push(option)
          val = val.replace(reg, '')
        } else {
          const lastVal = typeof content.at(-1) === 'string'
            ? content.pop()
            : ''

          content.push(`${lastVal}${val[0]}`)
          val = val.slice(1)
        }
      }

      this.content = content
      return content
    },

    renderMentionContent (id: string, name: string) {
      const { prefix, suffix, formatter } = this

      if (typeof formatter?.render === 'function') {
        return formatter.render(id, name)
      }

      if (typeof formatter?.render === 'object' && formatter.render.scopedSlot) {
        return this.$slots[formatter.render.scopedSlot]({ id, name })
      }

      return `${prefix}${name}${suffix}`
    }
  }
}
