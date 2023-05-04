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

    renderDropdown () {
      const { currentOptions } = this

      return (
        <div class={ DOM_CLASSES.DROPDOWN }>
          {
            currentOptions.length === 0
              ? this.renderDropdownEmpty()
              : this.renderMentionsList()
          }
        </div>
      )
    },

    renderDropdownEmpty () {
      return (
        <div class={ DOM_CLASSES.DROPDOWN_EMPTY }>
          { this.renderDropdownEmptyGraph() }
          <p>暂无数据</p>
        </div>
      )
    },

    renderDropdownEmptyGraph (width = 48, height = 31) {
      return <svg width={ width } height={ height } viewBox="0 0 64 41"><g transform="translate(0 1)" fill="none" fill-rule="evenodd"><ellipse fill="#F5F5F5" cx="32" cy="33" rx="32" ry="7"></ellipse><g fill-rule="nonzero" stroke="#D9D9D9"><path d="M55 12.76L44.854 1.258C44.367.474 43.656 0 42.907 0H21.093c-.749 0-1.46.474-1.947 1.257L9 12.761V22h46v-9.24z"></path><path d="M41.613 15.931c0-1.605.994-2.93 2.227-2.931H55v18.137C55 33.26 53.68 35 52.05 35h-40.1C10.32 35 9 33.259 9 31.137V13h11.16c1.233 0 2.227 1.323 2.227 2.928v.022c0 1.605 1.005 2.901 2.237 2.901h14.752c1.232 0 2.237-1.308 2.237-2.913v-.007z" fill="#FAFAFA"></path></g></g></svg>
    },

    renderMentionsList () {
      const {
        currentOptions,
        activeOptionIdx
      } = this

      return (
        <ul class={ DOM_CLASSES.DROPDOWN_LIST }>
          {
            currentOptions.map((option, index) => (
              <li
                class={ `${DOM_CLASSES.DROPDOWN_LIST_OPTION} ${activeOptionIdx === index
                    ? 'active'
                    : ''
                  }` }
                data-value={ option.value }
                onMouseenter={ () => this.handleDropdownListOptionMouseenter(index) }
                onMousedown={ e => this.handleDropdownListOptionMousedown(index, e) }
              >
                { option.label }
              </li>
            ))
          }
        </ul>
      )
    },

    renderContent (content) {
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

        return `${html}<em class="${DOM_CLASSES.MENTION}" data-id="${item.value}" data-name="${item.label}" contenteditable="false">@${item.label} </em>`
      }, '')
    }
  }
}
