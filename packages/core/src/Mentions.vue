<script lang="jsx">
import {
  computePosition,
  createAtElement,
  insertNodeAfterRange,
  integerValidator,
  isMention,
  isNodeAfterNode,
  setRangeAfterNode,
  valueFormatter
} from './libs/utils.ts'

import { DOM_CLASSES } from './libs/config.ts'

import {
  RenderMixin,
  MentionsMixin,
  OptionsMixin
} from './mixins'

export default {
  name: 'VueMentions',

  mixins: [
    RenderMixin,
    MentionsMixin,
    OptionsMixin
  ],

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

    // value 最大长度限制
    // 注意，此长度可能和输入框中的实际上度不一致
    // 如：value = `#{name:张三,id:12345}你好`，长度为 21
    // 而在输入框里面的内容为 `@张三 你好`，长度为 6
    // 这里需要开发人员自行对值的长度进行计算
    maxLength: {
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

      // 记录选区及当前内容
      state: {
        innerHTML: '',
        anchorNodeIdx: -1,
        anchorOffset: -1,
        focusNodeIdx: -1,
        focusOffset: -1
      }
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
          this.currentInputValue = val
          this.$nextTick(() => {
            this.renderContent(this.formatContent(val))
          })
        }
      }
    }
  },

  methods: {
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

    handleClick () {
      if (this.dropdownVisible) {
        this.close()
      }
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

    handleBeforeInput (e) {
      const { open, maxLength } = this
      const { target, data, inputType } = e

      const value = valueFormatter(target.innerHTML)

      if (!this.dropdownVisible) {
        this.recordState()
      }

      if (integerValidator(maxLength) && value.length + 1 > maxLength) {
        return
      }

      // 在进行过滤时，不允许向后删除数据
      if (
        this.dropdownVisible &&
        inputType === 'deleteContentForward' &&
        !window.getSelection().getRangeAt(0).startOffset - 1 === (this.filterValue?.length || 0)
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

    async handleInput (e) {
      const { data, inputType, target } = e
      const { filterValue, dropdownVisible, maxLength, state } = this

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
        return
      }

      const value = valueFormatter(target.innerHTML)

      if (integerValidator(maxLength) && value.length > maxLength) {
        const {
          innerHTML,
          anchorNodeIdx,
          anchorOffset,
          focusNodeIdx,
          focusOffset
        } = state
        target.innerHTML = innerHTML
        const selection = window.getSelection()

        let anchorNode = target.childNodes[anchorNodeIdx]
        if (anchorNode?.nodeType !== 3) {
          anchorNode = target
        }
        let focusNode = target.childNodes[focusNodeIdx]
        if (focusNode?.nodeType !== 3) {
          focusNode = target
        }
        const range = new Range()
        range.setStart(anchorNode, anchorOffset)
        range.setEnd(focusNode, focusOffset)
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }

      this.currentInputValue = value
      this.getMentionsByValueChange()
      this.$emit('change', value)
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

      // Keep the order of execution
      this.fetchOriginOptions()
    },

    close () {
      this.filterValue = undefined
      this.dropdownVisible = false

      const oContainer = this.$refs.Container
      const oAt = oContainer.querySelector(`.${DOM_CLASSES.AT}`)

      if (oAt) {
        let text = oAt.textContent
        oAt.remove()
        if (text.length > 0) {
          const { maxLength, value } = this
          // 对内容进行截取
          if (integerValidator(maxLength) && value.length + text.length > maxLength) {
            text = text.slice(maxLength - value.length)
          }
          // 插入文本内容
          insertNodeAfterRange(document.createTextNode(text))
        }
      }

      this.$emit('close')
    },

    // 记录 state
    recordState () {
      const oEditor = this.$refs.Editor
      if (!oEditor) {
        return
      }
      const { childNodes, innerHTML } = oEditor

      // 如果内容已经为空
      if (!innerHTML) {
        Object.assign(this.state, {
          innerHTML: '',
          anchorNodeIdx: 0,
          anchorOffset: 0,
          focusNodeIdx: 0,
          focusOffset: 0
        })

        return
      }

      let {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      } = window.getSelection()

      let anchorNodeIdx = [].indexOf.call(childNodes, anchorNode)
      let focusNodeIdx = [].indexOf.call(childNodes, focusNode)

      // 修正索引，在插入 textNode 时，有可能会导致多个 textNode 连续存在
      if (childNodes[anchorNodeIdx - 1]?.nodeType === 3) {
        anchorNodeIdx -= 1
        anchorOffset += childNodes[anchorNodeIdx - 1].nodeValue.length
      } else if (anchorNode === oEditor) {
        anchorNodeIdx = anchorOffset
        anchorOffset = childNodes[anchorNodeIdx] || 0

        if (anchorOffset) {
          anchorOffset = anchorOffset.nodeValue.length

          while (childNodes[anchorNodeIdx - 1]?.nodeType === 3) {
            anchorNodeIdx -= 1
            anchorOffset += childNodes[anchorNodeIdx].nodeValue.length
          }
        }
      }

      if (childNodes[focusNodeIdx - 1]?.nodeType === 3) {
        focusNodeIdx -= 1
        focusOffset += childNodes[focusNodeIdx - 1].nodeValue.length
      } else if (focusNode === oEditor) {
        focusNodeIdx = focusOffset
        focusOffset = childNodes[focusNodeIdx] || 0

        if (focusOffset) {
          focusOffset = focusOffset.nodeValue.length

          while (childNodes[focusNodeIdx - 1]?.nodeType === 3) {
            focusNodeIdx -= 1
            focusOffset += childNodes[focusNodeIdx].nodeValue.length
          }
        }
      }

      Object.assign(this.state, {
        anchorNodeIdx,
        focusNodeIdx,
        anchorOffset,
        focusOffset,
        innerHTML
      })
    }
  },

  render () {
    return (
      <div
        ref="Container"
        class={ DOM_CLASSES.CONTAINER }
      >
        <div
          ref="Editor"
          class={ DOM_CLASSES.INPUT }
          contenteditable
          data-type={ this.type }
          onKeydown={ this.handleKeydown }
          onBeforeinput={ this.handleBeforeInput }
          onInput={ this.handleInput }
          onClick={ this.handleClick }
          onScroll={ this.handleScroll }
          onMousedown={ this.handleMousedown }
        ></div>
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
