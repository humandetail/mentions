// @ts-nocheck
import {
  DOM_CLASSES
} from '../libs/config'

export default {
  props: {
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
    /**
     * 自定义请求 options
     * 此属性优先级比 options 高，如设置此属性，则会忽略 options 的所有内容
     * 函数需要返回如下内容：
     * ```ts
     * Promise<[{ label: string, value: string }]>
     * ```
     */
    optionsFetchApi: {
      type: Function
    },
    /**
     * 自定义请求的时机，默认在展开下拉列表时请求
     */
    immediate: {
      type: Boolean,
      default: false
    },
    loading: {
      type: Boolean,
      default: false
    },

    // 下拉列表查询过滤函数
    filterOption: {
      type: Function
    },

    // 下拉框最大宽度
    dropdownMaxWidth: {
      type: Number
    },
    // 下拉框最大高度
    dropdownMaxHeight: {
      type: Number
    }
  },

  data () {
    return {
      fetchLoading: false,
      remoteOptions: []
    }
  },

  computed: {
    localOptions () {
      const { optionsFetchApi, options, remoteOptions, labelFieldName, valueFieldName } = this

      return (typeof optionsFetchApi === 'function' ? remoteOptions : options).map(option => ({
        ...option,
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

  methods: {
    async fetchRemoteOptions () {
      const {
        optionsFetchApi,
        immediate,
        remoteOptions
      } = this

      if (
        typeof optionsFetchApi === 'function' &&
        !immediate &&
        remoteOptions.length === 0
      ) {
        this.fetchLoading = true
        this.remoteOptions = await optionsFetchApi().finally(() => {
          this.fetchLoading = false
        })

        if (this.dropdownVisible) {
          const oDropdown = this.$refs.Container.querySelector(`.${DOM_CLASSES.DROPDOWN}`)
          oDropdown.style.cssText = ''
          this.open()
        }
      }
    },

    renderDropdown () {
      const { currentOptions, fetchLoading } = this

      return (
        <div class={ DOM_CLASSES.DROPDOWN }>
          {
            currentOptions.length === 0
              ? this.renderDropdownEmpty()
              : this.renderMentionsList()
          }
          {
            fetchLoading ? this.renderDropdownLoading() : null
          }
        </div>
      )
    },

    renderDropdownEmpty () {
      return (
        <div class={ DOM_CLASSES.DROPDOWN_EMPTY }>
          { this.renderDropdownEmptyGraph() }
        </div>
      )
    },

    renderDropdownLoading () {
      return (
        <div class={ DOM_CLASSES.DROPDOWN_LOADING }>
          <svg focusable="false" class={ DOM_CLASSES.DROPDOWN_LOADING_SPIN } data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true" viewBox="0 0 1024 1024"><path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg>
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
                    ? DOM_CLASSES.DROPDOWN_LIST_OPTION_ACTIVE
                    : ''
                  } ${option.disabled ? DOM_CLASSES.DROPDOWN_LIST_OPTION_DISABLED : ''}` }
                data-value={ option.value }
                onMouseenter={ () => this.handleDropdownListOptionMouseenter(index) }
                onMousedown={ e => this.handleDropdownListOptionMousedown(index, e) }
              >
                { typeof option.customRender === 'function' ? option.customRender(option, index) : option.label }
              </li>
            ))
          }
        </ul>
      )
    }
  }
}
