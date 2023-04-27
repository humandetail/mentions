<script lang="jsx">
import {
  computePosition,
  createAtElement,
  createMentionElement,
  insertNodeAfterRange,
  integerValidator,
  isMention,
  isNodeAfterNode,
  setRangeAfterNode,
  valueFormatter
} from './utils.ts'

import { DOM_CLASSES, INSERT_TEXT_TYPE, MENTION_REG } from './config.ts'

export default {
  name: 'VueMentions',

  props: {
    type: {
      type: String,
      default: 'input',
      validator: val => ['input', 'textarea'].includes(val)
    },

    value: {
      type: String
    },

    initialValue: {
      type: String
    },

    options: {
      type: Array,
      default: () => []
    },
    labelFieldName: {
      type: String,
      default: 'label'
    },
    valueFieldName: {
      type: String,
      default: 'value'
    },

    filterOption: {
      type: Function
    },

    maxLength: {
      type: Number
    },

    dropdownMaxWidth: {
      type: Number
    },

    dropdownMaxHeight: {
      type: Number
    }
  },

  data () {
    return {
      currentValue: this.value === undefined
        ? this.initialValue
        : this.value,

      currentInputValue: undefined,
      content: [],
      // 当前匹配到的所有 Mentions
      currentMentions: [],

      filterValue: undefined,

      dropdownVisible: false,
      // 当 dropdown 被点开时，默认选中 currentOptions 中的第一项
      activeOptionIdx: -1,
      switchKey: undefined
    }
  },

  computed: {
    localOptions () {
      const { options, labelFieldName, valueFieldName } = this

      return options.map(option => ({
        label: option[labelFieldName],
        value: option[valueFieldName]
      }))
    },

    currentOptions () {
      const { localOptions, filterValue, filterOption } = this
      if (!filterValue) {
        return localOptions
      }

      if (typeof filterOption === 'function') {
        return localOptions.filter(option => filterOption(option, filterValue))
      }
      return localOptions.filter(option => option.label.toLowerCase().indexOf(filterValue.toLowerCase()) >= 0)
    }
  },

  watch: {
    currentValue: {
      deep: true,
      immediate: true,
      handler (val) {
        const { maxLength } = this
        if (val && val !== this.currentInputValue) {
          if (maxLength && val.length > maxLength) {
            val = val.slice(0, maxLength)
          }
          this.formatContent(val)
          this.currentInputValue = val
        }
      }
    },

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

      this.content = content
    },

    handleKeydown (e) {
      const { key } = e

      if (this.dropdownVisible) {
        if (['ArrowDown', 'ArrowUp'].includes(key)) {
          e.preventDefault()
          this.switchKey = key
          this.switchActiveOption(key)
        } else if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(key)) {
          this.close()
        } else if (key === 'Enter') {
          e.preventDefault()
          this.appendMentionByIndex(this.activeOptionIdx)
        }
      } else {
        if (key === 'Enter' && this.type === 'input') {
          e.preventDefault()
        }
      }
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

    handleClick () {
      if (this.dropdownVisible) {
        this.close()
      }
    },

    handleDropdownListOptionMouseenter (index) {
      this.activeOptionIdx = index
    },

    handleDropdownListOptionMousedown (index, e) {
      e.preventDefault()
      this.activeOptionIdx = index

      this.appendMentionByIndex(index)
    },

    handleScroll () {
      if (this.type !== 'textarea' || !this.dropdownVisible) {
        return
      }

      const oContainer = this.$refs.Container

      const oDropdown = oContainer.querySelector(`.${DOM_CLASSES.DROPDOWN}`)
      const oAt = oContainer.querySelector(`.${DOM_CLASSES.AT}`)

      const { top, bottom } = oContainer.querySelector(`.${DOM_CLASSES.INPUT}`).getBoundingClientRect()
      const { x, y, availableWidth, availableHeight } = computePosition(oAt, oDropdown)
      Object.assign(oDropdown.style, {
        left: `${x}px`,
        top: `${Math.min(bottom, Math.max(top, y))}px`,
        width: `${availableWidth}px`,
        height: `${availableHeight}px`
      })
    },

    appendMentionByIndex (index) {
      const {
        currentOptions
      } = this
      const item = currentOptions[index]
      this.currentMentions.push(item)

      // 1. 清除输入内容
      const range = new Range()
      range.selectNode(this.$refs.Container.querySelector(`.${DOM_CLASSES.AT}`))
      range.deleteContents()

      // 2. 插入 @Mention 内容块并让光标位置插入块之后
      const oM = createMentionElement(item.label, item.value)
      insertNodeAfterRange(oM)

      // 3. 关闭 dropdown
      this.close()
    },

    handleBeforeInput (e) {
      const { maxLength, open } = this

      const { target, data, inputType } = e
      const value = target.innerText

      // 如果设置了输入长度限制，同时当前的操作类型是输入内容
      // 并且输入后的长度超过限制，则阻止输入
      if (
        integerValidator(maxLength) &&
        (value + data).length > maxLength &&
        INSERT_TEXT_TYPE.includes(inputType)
      ) {
        e.preventDefault()
        return
      }

      // 输入 `@` 符号时，展开 Mentions 列表
      if (data === '@' && !this.dropdownVisible) {
        e.preventDefault()

        const range = window.getSelection().getRangeAt(0)

        const oAt = createAtElement()

        range.insertNode(oAt)
        setRangeAfterNode(oAt.firstChild)

        open()
      }
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
    },

    async handleInput (e) {
      const { data, inputType, target } = e

      const value = valueFormatter(target.innerHTML)
      this.currentInputValue = value
      this.getMentionsByValueChange()
      this.$emit('change', value)

      const { filterValue, dropdownVisible } = this

      // 当 Mentions 列表被展开时，后续输入所有字符都当成过滤字符
      if (dropdownVisible) {
        if (inputType === 'deleteContentBackward') {
          if (filterValue) {
            this.filterValue = filterValue.slice(0, -1)
          } else {
            this.close()
          }
        } else {
          this.filterValue = !filterValue
            ? data
            : `${filterValue}${data}`

          this.$nextTick(() => {
            if (this.currentOptions.length === 0) {
              this.close()
            }
          })
        }
      }
    },

    handleMousedown () {
      document.addEventListener('mouseup', this.handleMouseup, { once: true })
    },

    handleMouseup () {
      const selection = window.getSelection()
      const { anchorNode, focusNode } = selection
      const range = selection.getRangeAt(0)

      // 单击 mention
      if (
        anchorNode === focusNode &&
        (
          isMention(anchorNode) ||
          isMention(anchorNode.parentNode)
        )
      ) {
        range.selectNode(
          isMention(anchorNode)
            ? anchorNode
            : anchorNode.parentNode
        )
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }

      // 结束点选中 mention
      if (isMention(anchorNode) || isMention(focusNode)) {
        if (isNodeAfterNode(anchorNode, focusNode)) {
          range.setEndAfter(focusNode)
        } else {
          range.setStartBefore(focusNode)
        }
      }
    },

    async open () {
      this.dropdownVisible = true
      await this.$nextTick()
      this.$emit('open')

      // 默认选中第一个 options
      const { currentOptions, dropdownMaxWidth, dropdownMaxHeight } = this
      if (currentOptions.length > 0) {
        this.activeOptionIdx = 0
      }

      const oRoot = this.$refs.Container

      const oContrast = oRoot.querySelector(`.${DOM_CLASSES.AT}`)
      const oDropdown = oRoot.querySelector(`.${DOM_CLASSES.DROPDOWN}`)

      const rect = computePosition(oContrast, oDropdown)
      Object.assign(oDropdown.style, {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        maxWidth: `${typeof dropdownMaxWidth === 'number' ? dropdownMaxWidth : rect.availableWidth}px`,
        maxHeight: `${typeof dropdownMaxHeight === 'number' ? dropdownMaxHeight : rect.availableHeight}px`,
        width: `${rect.availableWidth}px`,
        height: `${rect.availableHeight}px`
      })
    },

    close () {
      this.filterValue = undefined
      this.dropdownVisible = false

      const oContainer = this.$refs.Container
      const oAt = oContainer.querySelector(`.${DOM_CLASSES.AT}`)

      if (oAt) {
        const text = oAt.textContent.slice(1) // ignore `@`
        oAt.remove()
        if (text.length > 0) {
          insertNodeAfterRange(document.createTextNode(text))
        }
      }

      this.$emit('close')
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
    }
  },

  render () {
    return (
      <div
        ref="Container"
        class={ DOM_CLASSES.CONTAINER }
      >
        <div
          class={ DOM_CLASSES.INPUT }
          contenteditable
          data-type={ this.type }
          onKeydown={ this.handleKeydown }
          onBeforeinput={ this.handleBeforeInput }
          onInput={ this.handleInput }
          onClick={ this.handleClick }
          onScroll={ this.handleScroll }
          onMousedown={ this.handleMousedown }
        >
          {
            this.content.map(item => {
              if (typeof item === 'string') {
                if (this.type === 'input') {
                  return item
                }
                return item.split('\n').map((v, i) => {
                  if (i !== 0) {
                    return (
                      <>
                        <br></br>
                        { v }
                      </>
                    )
                  }
                  return v
                })
              }

              return (
                <em
                  class={ DOM_CLASSES.MENTION }
                  data-id={ item.value }
                  data-name={ item.label }
                  contenteditable={ false }
                >@{ item.label + ' ' }</em>
              )
            })
          }
        </div>
        <div>
          { this.dropdownVisible ? this.renderDropdown() : null }
        </div>
      </div>
    )
  }
}
</script>

<style src="./style.scss" lang="scss" scoped>
</style>
