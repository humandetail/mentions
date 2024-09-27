<script setup>
import Mentions from './components/Mentions.vue'
</script>

<h1 style="font-size:56px;line-height:64px;font-weight:bold;color:#10b981">
  Mentions.js
</h1>

<p style="font-size:24px;line-height:64px;font-weight:bold">
本项目致力于创建一个通过 div 模拟的 Input 输入框，使用户能够在文本中便捷地提及其他用户或实体。
</p>

## 演示

<Mentions />

## 安装

```bash
# npm
npm install mentions.js

# yarn
yarn add mentions.js

## pnpm
pnpm install mentions.js
```

## 使用

```js
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

const mentions = createMentions({
  value: '',
  options: [
    { value: 1, label: 'John' },
    { value: 2, label: 'Jack' },
    { value: 3, label: 'Tom' },
    { value: 4, label: 'Jerry' },
  ],
})

mentions.on('change', (value) => {
  console.log(value)
})

mentions.mount(document.getElementById('container'))
```

## 参数说明

所有参数如无特殊说明，均为**可选参数**。

| 名称 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| type | `input` \| `textarea` | `input` | 输入框类型 |
| value | `string` | `''` | - |
| initialValue | `string` | `''` | - |
| disabled | `boolean` | `false` | 是否禁止输入 |
| readonly | `boolean` | `false` | 输入框是否只读 |
| prefix | `string` | `@` | 触发提及的字符，长度限制为 `1`，也是提及块默认渲染在输入框中的前缀(eg. `#张三`) |
| suffix | `string` | `''` | 提及块默认渲染在输入框中的后缀(eg. `suffix: '!!!'` 输出 `#张三!!!`)  |
| maxLength | `number` | `0` | 内容长度，以输出内容长度为准，`0` 表示不限制长度 |
| getMentionLength | `null` \| `(option: MentionDropdownListOption) => number` | `getMentionLength(option) => number` | 指定提及块的输出长度 |
| showStatistics | `null` \| `(options: MentionDropdownListOption, currentMentions: MentionDropdownListOption[]) => string` | `showStatistics(options, currentMentions) => ''` | - |
| formatter | `null` \| `Formatter` | `null` | 详细说明请看 Formatter |
| options | `MentionDropdownListOption[]` | `[]` | 提及列表，只有在列表中的数据才可以提及 |
| labelFieldName | `string` | `label` | - |
| valueFieldName | `string` | `value` | - |
| optionsFetchApi | `null` \| `(...args: unknown[]) => Promise<MentionDropdownListOption[]>` | `null` | 获取提及参数列表的接口 |
| immediate | `boolean` | `false` | 是否在输入框加载完毕后立即请求，这个参数只有在配置了 `optionsFetchApi` 时生效 |
| filterOption | `(option: MentionDropdownListOption, filterValue: string) => boolean` | - | 提及列表使用搜索功能时的过滤函数 |
| dropdownMaxWidth | `null` \| `number` | `null` | 提及列表的宽度 |
| dropdownMaxHeight | `null` \| `number` | `200` | 提及列表的高度 |

### MentionDropdownListOption

```typescript
interface MentionDropdownListOption {
  value: string
  label: string
  disabled?: boolean
  // 自定义格式化输出的提及内容
  // @example
  // customRender(option = { label: '张三', value: 'A01' }) => `${option.label}-${option.value}`
  // =>
  // 张三-A01
  customRender?: (option: MentionDropdownListOption, index: number) => string
}
```

### Formatter

```typescript
interface Formatter {
  // 正则表达式，指示组件如何从 value 中把提及内容提取出来
  pattern: RegExp
  // 提及块的渲染函数，指示组件如何通过 value 和 label 来生成 HTML String
  render: ((label: string, value: label) => HTMLString)
  // 提及块的解析函数，指示组件如何通过 value 和 label 来生成输出时的提及块内容
  parser: (label: string, value: string) => string
}
```

## API

### `mount(el: string | HTMLElement)`

通过 `mount()` 方法，把组件挂载到对应的 DOM 里面。

### `destroy()`

调用之后会销毁当前组件。

### `set()`

- `(key: 'value', value: string): MentionConstructor`: 设置输入框的值。

- `(key: 'options', value: MentionDropdownListOption[]): MentionConstructor`: 设置可提及列表的内容。

- `(key: 'max-length', value: number): MentionConstructor`: 设置输入长度限制。


### `on()`

- `on('change', newValue, oldValue): void`: 当输入框的内容发生变化时触发。

- `on('mentions-change', newMentions, oldMentions): void`：当提及发生变化时触发。

### `once()`

同 `on()`，只监听一次

### `off()`

移除某个事件监听

### `clear()`

移除所有事件监听
