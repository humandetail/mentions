// @ts-nocheck
import {
  DOM_CLASSES,
  MENTION_REG,
  integerValidator
} from '../libs/config'

import {
  createMentionElement,
  insertNodeAfterRange,
  valueFormatter,
  computeMentionLength
} from '../libs/utils'

export default {
  props: {
    formatter: {
      type: Object,
      validator (val) {
        return (
          'pattern' in val &&
          'render' in val &&
          'parser' in val
        )
      }
    }
  },

  data () {
    return {
      // 当前匹配到的所有 Mentions
      currentMentions: [],

      filterValue: undefined,

      dropdownVisible: false,
      // 当 dropdown 被点开时，默认选中 currentOptions 中的第一项
      activeOptionIdx: -1,
      switchKey: undefined
    }
  },

  watch: {
    activeOptionIdx (idx) {
      const { dropdownVisible, intersectionObserver } = this
      if (dropdownVisible && intersectionObserver) {
        this.$nextTick(() => {
          intersectionObserver.observe(document.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`))
        })
      }
      this.$emit('active-option-change', this.localOptions[idx])
    },

    currentMentions (mentions) {
      this.$emit('mentions-change', mentions)
    }
  },

  mounted () {
    this.initObserver()
  },

  beforeDestroy () {
    if (this.intersectionObserver) {
      this.intersectionObserver.destroy()
    }
  },

  methods: {
    initObserver () {
      this.intersectionObserver = new IntersectionObserver(entries => {
        const { intersectionRatio } = entries[0]

        const oList = this.$refs.Container.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST}`)

        if (!oList) {
          return
        }

        const oActive = oList.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`)
        this.intersectionObserver.unobserve(oActive)

        if (intersectionRatio === 1) {
          return
        }

        const { activeOptionIdx } = this
        const optionHeight = oActive.getBoundingClientRect().height
        const paddingTop = parseInt(window.getComputedStyle(oList).paddingTop)
        oList.scrollTop = activeOptionIdx * optionHeight + (isNaN(paddingTop) ? 0 : paddingTop) // +4 padding-top
      })
    },

    switchActiveOption () {
      const { currentOptions, activeOptionIdx, switchKey } = this
      const len = currentOptions.length
      if (len === 0) {
        return
      }

      if (activeOptionIdx === -1) {
        this.activeOptionIdx = switchKey === 'ArrowDown'
          ? 0
          : len - 1
        return
      }

      if (activeOptionIdx === len - 1 && switchKey === 'ArrowDown') {
        this.activeOptionIdx = 0
        return
      }
      if (activeOptionIdx === 0 && switchKey === 'ArrowUp') {
        this.activeOptionIdx = len - 1
        return
      }
      this.activeOptionIdx = switchKey === 'ArrowDown'
        ? activeOptionIdx + 1
        : activeOptionIdx - 1
    },

    handleDropdownListOptionMouseenter (index) {
      this.activeOptionIdx = index
    },

    handleDropdownListOptionMousedown (index, e) {
      e.preventDefault()
      this.activeOptionIdx = index

      this.appendMentionByIndex(index)
    },

    appendMentionByIndex (index) {
      const {
        currentOptions,
        prefix,
        suffix,
        value,
        maxLength
      } = this

      const item = currentOptions[index]

      // 1. 清除输入内容
      const range = new Range()
      range.selectNode(this.$refs.Container.querySelector(`.${DOM_CLASSES.AT}`))
      range.deleteContents()

      const oActiveMention = this.$refs.Container.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE}`)

      if (!oActiveMention.classList.contains(DOM_CLASSES.DROPDOWN_LIST_OPTION_DISABLED)) {
        // 2. 插入 @Mention 内容块并让光标位置插入块之后
        const oM = createMentionElement(item.label, item.value, prefix, suffix)

        if (!(integerValidator(maxLength) && this.getValueLength(value) + computeMentionLength(item, this.getMentionLength) > maxLength)) {
          // 只允许在剩余长度足够的情况下插入 mention
          insertNodeAfterRange(oM)
        }
      }

      // 3. 关闭 dropdown
      this.close()

      // 4. 记录新的内容
      const newValue = valueFormatter(this.$refs.Editor.innerHTML, this.formatter?.parser)
      this.currentInputValue = newValue
      this.getMentionsByValueChange()
      this.$emit('change', newValue)
    },

    getMentionsByValueChange () {
      let { currentInputValue: val, formatter } = this
      let match

      const reg = formatter?.pattern || MENTION_REG

      const currentMentions = []
      while (val?.length) {
        match = val.match(reg)
        if (!match) {
          val = val.slice(1)
        } else {
          currentMentions.push({
            label: match[1],
            value: match[2]
          })
          val = val.replace(reg, '')
        }
      }
      this.currentMentions = currentMentions
    }
  }
}
