// @ts-nocheck
import { DOM_CLASSES, MENTION_REG } from '../libs/config'
import { createMentionElement, insertNodeAfterRange } from '../libs/utils'

export default {
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
          intersectionObserver.observe(document.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.active`))
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
        const oActive = oList.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.active`)
        this.intersectionObserver.unobserve(oActive)
        if (intersectionRatio === 1) {
          return
        }

        if (!oList) {
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
        suffix
      } = this
      const item = currentOptions[index]

      // 1. 清除输入内容
      const range = new Range()
      range.selectNode(this.$refs.Container.querySelector(`.${DOM_CLASSES.AT}`))
      range.deleteContents()

      // 2. 插入 @Mention 内容块并让光标位置插入块之后
      const oM = createMentionElement(item.label, item.value, prefix, suffix)
      insertNodeAfterRange(oM)

      // 3. 关闭 dropdown
      this.close()
    },

    getMentionsByValueChange () {
      let { currentInputValue: val } = this
      let match

      const currentMentions = []
      while (val?.length) {
        match = val.match(MENTION_REG)
        if (!match) {
          val = val.slice(1)
        } else {
          currentMentions.push({
            label: match[1],
            value: match[2]
          })
          val = val.slice(match[0].length)
        }
      }
      this.currentMentions = currentMentions
    }
  }
}
