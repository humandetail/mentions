<script setup>
import Mentions from './components/Mentions.vue'
</script>

<h1 style="font-size:56px;line-height:64px;font-weight:bold;color:#10b981">mentions.js</h1>
<p style="font-size:56px;line-height:64px;font-weight:bold">A mentions input base on vanilla JS.</p>

## Getting Started

```bash
npm install mentions.js
```

## Usage Mentions
```js
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

const mentions = createMentions({
  value: '',
  options: [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jack' },
    { id: 3, name: 'Tom' },
    { id: 4, name: 'Jerry' },
  ],
})

mentions.on('change', (value) => {
  console.log(value)
})

mentions.mount(document.getElementById('container'))
```

## createMentions Options

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| type | `input` \| `textarea` | `input` | render input type. |
| value | `string` | `''` | The initial value of the mentions input. |
| options | See the table below | `[]` | The options of the mentions input. |
| placeholder | `string` | `'@'` | The placeholder of the mentions input. |

### Options
| Name | Type | Description |
| --- | --- | --- |
| id | `string` | The id of the option. |
| name | `string` | The name of the option. |
| disabled | `boolean` | Whether the option is disabled. |
| customRender | `(option: MentionDropdownListOption, index: number) => string` | Custom render option. |

## Playground

<Mentions />
