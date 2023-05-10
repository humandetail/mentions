<script lang="jsx">
import {
  computePosition,
  createAtElement,
  integerValidator,
  isMention,
  isNodeAfterNode,
  setRangeAfterNode,
  valueFormatter,
  computeMentionLength
} from './libs/utils.ts'

import { DOM_CLASSES, MENTION_REG, HTML_ENTITY_CHARACTER_REG } from './libs/config.ts'

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

    disabled: Boolean,
    readonly: Boolean,

    prefix: {
      type: String,
      default: '@'
    },

    suffix: {
      type: String,
      default: ' '
    },

    // value 最大长度限制
    // 注意，此长度可能和输入框中的实际上度不一致
    // 如：value = `#{name:张三,id:12345}你好`，长度为 21
    // 而在输入框里面的内容为 `@张三 你好`，长度为 6
    // 这里需要开发人员自行对值的长度进行计算
    maxLength: {
      type: Number
    },

    // 获取 mention 的长度
    getMentionLength: {
      type: Function
    },

    showStatistics: {
      type: Function
    }
  },

  data () {
    return {
      currentValue: this.value === undefined
        ? this.initialValue
        : this.value,

      currentInputValue: undefined,
      content: []
    }
  },

  computed: {
    valueLength () {
      return this.getValueLength(this.value)
    }
  },

  watch: {
    currentValue: {
      deep: true,
      immediate: true,
      handler (val) {
        const { maxLength } = this
        if (val && val !== this.currentInputValue) {
          if (integerValidator(maxLength) && this.getValueLength(val) > maxLength) {
            val = val.slice(0, maxLength)
            this.$emit('change', val)
          }
          this.currentInputValue = val
          this.$nextTick(() => {
            this.formatContent(val)
          })
        }
      }
    },
    content: {
      deep: true,
      handler () {
        // 去除空行
        this.$nextTick(() => {
          // eslint-disable-next-line no-self-assign
          this.$refs.Editor.innerHTML = this.$refs.Editor.innerHTML.replace(/\n/g, '<br/>')
        })
      }
    }
  },

  methods: {
    getValueLength (val) {
      const { formatter, getMentionLength } = this
      const reg = formatter?.pattern || MENTION_REG

      let length = 0
      let atMatch

      while (val.length) {
        if ((atMatch = val.match(reg))) {
          length += computeMentionLength({ label: atMatch[1], value: atMatch[2] }, getMentionLength)
          val = val.replace(reg, '')
        } else if (val.match(HTML_ENTITY_CHARACTER_REG)) {
          length++
          val = val.replace(HTML_ENTITY_CHARACTER_REG, '')
        } else {
          length++
          val = val.slice(1)
        }
      }

      return length
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
        if (key === 'Enter') {
          e.preventDefault()
          if (this.type === 'textarea') {
            const selection = window.getSelection()
            if (selection.focusNode.nextSibling) {
              document.execCommand('insertHTML', false, '<br/>')
              return
            }

            const range = selection.getRangeAt(0)
            range.deleteContents()
            const br = document.createElement('br')
            range.insertNode(br)

            // 将光标移到 br 标签的下一行
            range.setStartAfter(br)
            range.setEndAfter(br)
            selection.removeAllRanges()
            selection.addRange(range)
            range.insertNode(document.createElement('br'))
          }
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
      const { open, maxLength, prefix } = this
      const { target, data, inputType } = e

      const value = valueFormatter(target.innerHTML, this.formatter?.parser)
      const valueLength = this.getValueLength(value)

      if (!this.dropdownVisible) {
        this.recordState()
      }

      if (integerValidator(maxLength) && valueLength + 1 > maxLength) {
        return
      }

      // 在进行过滤时，不允许向后删除数据
      if (
        this.dropdownVisible &&
        inputType === 'deleteContentForward' &&
        !window.getSelection().getRangeAt(0).startOffset - 1 === (this.filterValue?.length ?? 0)
      ) {
        e.preventDefault()
        return
      }

      // 输入 `@` 符号时，展开 Mentions 列表
      if (data === prefix && !this.dropdownVisible) {
        e.preventDefault()

        const range = window.getSelection().getRangeAt(0)

        const oAt = createAtElement(prefix)

        range.insertNode(oAt)
        setRangeAfterNode(oAt.firstChild)

        open()
      }
    },

    async handleInput (e) {
      const { data, inputType, target } = e
      const { filterValue, dropdownVisible, maxLength } = this

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

      const value = valueFormatter(target.innerHTML, this.formatter?.parser)

      // 输入达到最大值的时候还原输入框的值
      if (integerValidator(maxLength) && this.getValueLength(value) > maxLength) {
        this.restoreState(target)
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
      this.fetchRemoteOptions()
    },

    close () {
      this.filterValue = undefined
      this.dropdownVisible = false

      const oContainer = this.$refs.Container
      const oEditor = oContainer.querySelector(`.${DOM_CLASSES.INPUT}`)
      const oAt = oContainer.querySelector(`.${DOM_CLASSES.AT}`)

      if (oAt) {
        this.renderFailureAt(oAt, oEditor)
      }

      this.$emit('close')
    }
  },

  render () {
    const {
      disabled,
      readonly,
      type,
      content,
      dropdownVisible
    } = this

    return (
      <div
        ref="Container"
        class={ DOM_CLASSES.CONTAINER }
      >
        <div
          ref="Editor"
          class={ `${DOM_CLASSES.INPUT}${disabled ? ' ' + DOM_CLASSES.DISABLED : ''}${readonly ? ' ' + DOM_CLASSES.READONLY : ''}` }
          contenteditable={ !disabled && !readonly }
          disabled={ !!disabled }
          readonly={ !!readonly }
          data-type={ type }
          onKeydown={ this.handleKeydown }
          onBeforeinput={ this.handleBeforeInput }
          onInput={ this.handleInput }
          onClick={ this.handleClick }
          onScroll={ this.handleScroll }
          onMousedown={ this.handleMousedown }
          onFocus={ e => e.target.classList.add(DOM_CLASSES.FOCUSED) }
          onBlur={ e => e.target.classList.remove(DOM_CLASSES.FOCUSED) }
        >
          {
            content.map(item => {
              if (typeof item === 'string') {
                return item
              }

              return (
                <em
                  class={ DOM_CLASSES.MENTION }
                  data-id={ item.value }
                  data-name={ item.label }
                  contenteditable={ false }
                >{ this.renderMentionContent(item.value, item.label) }</em>
              )
            })
          }
        </div>

        <div class="">
          { typeof this.showStatistics === 'function' ? this.showStatistics(this.valueLength, this.maxLength, this.currentMentions) : null }
        </div>

        <div>
          { dropdownVisible ? this.renderDropdown() : null }
        </div>
      </div>
    )
  }
}
</script>

<style src="./style.scss" lang="scss" scoped>
</style>
