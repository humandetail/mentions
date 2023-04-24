<script lang="jsx">
import {
  computePosition,
  size,
  autoPlacement,
  arrow
} from '@floating-ui/dom'

import { getMatchMention } from './utils.ts'

import { DOM_CLASSES } from './config.ts'

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

    filterOption: Function,

    maxLength: {
      type: Number,
      default: 0
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
      currentMetions: [],

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
          intersectionObserver.observe(document.querySelector('.vue-mentions__dropdown-list-option.active'))
        })
      }
      this.$emit('active-option-change', this.localOptions[idx])
    },

    currentMetions (mentions) {
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
      const oRoot = this.$refs.Container
      this.intersectionObserver = new IntersectionObserver(entries => {
        const { intersectionRatio } = entries[0]

        this.intersectionObserver.unobserve(oRoot.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST_OPTION}.active`))
        if (intersectionRatio === 1) {
          return
        }

        const oList = oRoot.querySelector(`.${DOM_CLASSES.DROPDOWN_LIST}`)
        if (!oList) {
          return
        }
        const { activeOptionIdx } = this
        oList.scrollTop = activeOptionIdx * 28 + 4 // +4 padding-top
      })
    },

    formatContent (val) {
      const { localOptions } = this

      const content = []
      while (val.length) {
        if (val.indexOf('@') > 0) {
          const lastVal = typeof content.at(-1) === 'string'
            ? content.pop()
            : ''
          content.push(lastVal + val.slice(0, val.indexOf('@'))) // consume `@`
          val = val.slice(val.indexOf('@'))

          const match = getMatchMention(localOptions, val)

          if (match) {
            content.push(match)
            val = val.slice(match.label.length + 1)
            this.currentMetions.push(match)
          } else {
            const lastVal = typeof content.at(-1) === 'string'
              ? content.pop()
              : ''
            content.push(lastVal + val.slice(0, 1)) // consume `@`
            val = val.slice(1)
          }
        } else {
          content.push(
            this.type === 'input'
              ? val.replace(/\n/g, '')
              : val
          )
          val = ''
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

    appendMentionByIndex (index) {
      const {
        currentOptions,
        filterValue
      } = this
      const item = currentOptions[index]
      this.currentMetions.push(item)

      const range = new Range()

      const selection = window.getSelection()
      const {
        focusNode,
        focusOffset
      } = selection

      // 1. 清除输入内容
      range.setStart(focusNode, Math.max(0, focusOffset - (filterValue?.length || 0) - 1))
      range.setEnd(focusNode, focusOffset)
      range.deleteContents()

      // 2. 插入 @Mention 内容块
      const oM = document.createElement('em')
      oM.className = DOM_CLASSES.MENTION
      oM.setAttribute('data-id', item.value)
      oM.setAttribute('contenteditable', false)
      oM.innerText = `@${item.label} `
      range.insertNode(oM)

      // 3. 让光标位置插入块之后
      range.setStartAfter(oM)
      range.setEndAfter(oM)
      selection.removeAllRanges()
      selection.addRange(range)

      // 4. 关闭 dropdown
      this.close()
    },

    handleBeforeinput (e) {
      const { maxLength } = this

      const value = e.target.innerText
      if (maxLength && value.length > maxLength) {
        e.preventDefault()
      }
    },

    handleInput (e) {
      const { data, inputType, target } = e

      const value = target.innerText

      this.currentInputValue = value
      this.$emit('change', value)

      // 输入 `@` 符号时，展开 Mentions 列表
      if (data === '@' && !this.dropdownVisible) {
        // e.preventDefault()
        const selection = window.getSelection()

        const range = document.createRange()
        range.selectNode(selection.focusNode)
        const rect = range.getBoundingClientRect()

        const oAt = this.$refs.Container.querySelector(`.${DOM_CLASSES.AT}`)

        Object.assign(oAt.style, {
          // left + width * (offset / lenth)
          left: `${rect.left + rect.width * selection.focusOffset / selection.focusNode.textContent.length}px`,
          top: `${rect.top}px`,
          height: `${rect.height}px`
        })
        this.open()
        return
      }

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

    async open () {
      this.dropdownVisible = true
      await this.$nextTick()
      this.$emit('open')

      // 默认选中第一个 options
      const { currentOptions } = this
      if (currentOptions.length > 0) {
        this.activeOptionIdx = 0
      }

      const oRoot = this.$refs.Container

      const oContrast = oRoot.querySelector(`.${DOM_CLASSES.AT}`)
      const oDropdown = oRoot.querySelector(`${DOM_CLASSES.DROPDOWN}`)
      const oArrow = oDropdown.querySelector(`${DOM_CLASSES.DROPDOWN_ARROW}`)

      const position = await computePosition(oContrast, oDropdown, {
        middleware: [
          autoPlacement({
            allowedPlacements: ['top', 'bottom']
          }),
          size({
            apply ({ availableWidth, availableHeight, elements }) {
              Object.assign(elements.floating.style, {
                maxWidth: `${availableWidth}px`,
                height: `${Math.min(200, availableHeight)}px`
              })
            }
          }),
          arrow({
            element: oArrow
          })
        ]
      })

      Object.assign(oDropdown.style, {
        left: `${position.x}px`,
        top: `${position.y}px`
      })
      const { x, y } = position.middlewareData.arrow

      oArrow.classList.remove('arrow-top')
      oArrow.classList.remove('arrow-bottom')
      oArrow.classList.add(`arrow-${position.placement}`)
      Object.assign(oArrow.style, {
        left: x != null ? `${x}px` : '',
        top: y != null ? `${y}px` : ''
      })
    },

    close () {
      this.filterValue = undefined
      this.dropdownVisible = false
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
          <div class={ DOM_CLASSES.DROPDOWN_ARROW }></div>
        </div>
      )
    },

    renderDropdownEmpty () {
      return (
        <div class={ DOM_CLASSES.DROPDOWN_EMPTY }>
          NO DATA
        </div>
      )
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
                class={`${DOM_CLASSES.DROPDOWN_LIST_OPTION}${
                  activeOptionIdx === index
                    ? 'active'
                    : ''
                }`}
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
        { this.dropdownVisible ? this.renderDropdown() : null }
        <div class={ DOM_CLASSES.AT }></div>
        <div
          class={ DOM_CLASSES.INPUT }
          contenteditable
          onKeydown={ this.handleKeydown }
          onBeforeinput={ this.handleBeforeinput }
          onInput={ this.handleInput }
          onClick={ this.handleClick }
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
                  contenteditable={ false }
                >@{ item.label + ' ' }</em>
              )
            })
          }
        </div>
      </div>
    )
  }
}
</script>

<style src="./style.scss" lang="scss" scoped></style>
