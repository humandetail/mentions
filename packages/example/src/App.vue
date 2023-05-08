<template>
  <div>
    Vue Mentions

    <VueMentions
      type="textarea"
      :value="value"
      :options="options"
      :dropdownMaxWidth="100"
      :dropdownMaxHeight="200"
      :max-length="90"
      :options-fetch-api="fetchOptions"
      prefix="#"
      suffix="#"
      :formatter="formatter"
      @change="value = $event"
    >
      <template v-slot:mention="{ id, name }">🚀--{{ id }} -- {{ name }}</template>
    </VueMentions>
  </div>
</template>

<script setup lang="tsx">
// import { onMounted } from 'vue'

import { ref } from 'vue'
import { VueMentions } from '../../core/index'
import '../../core/src/style.scss'

const options = [
  { label: 'Detail', value: 1 },
  { label: 'libon', value: 2 },
  { label: '张 三', value: 3 },
  { label: '李 四', value: 4 },
  { label: '王 五', value: 5 },
  { label: '赵 六', value: 6 },
  { label: '田 七', value: 7 },
  { label: '胡 八', value: 8 },
  { label: '老 九', value: 9 }
]

const value = ref(
  '你好<name:张三,id:3>,这里是<name:Detail,id:1>和<name:libon,id:2>，<name:张三,id:3>Hello wor\nld！'
)

const fetchOptions = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { label: 'A Detail', value: 1 },
        { label: 'B libon', value: 2 },
        { label: 'C 张 三', value: 3 },
        { label: 'D 李 四', value: 4 },
        { label: 'E 王 五', value: 5 },
        { label: 'F 赵 六', value: 6 },
        { label: 'G 田 七', value: 7 },
        { label: 'H 胡 八', value: 8 },
        { label: 'I 老 九', value: 9 }
      ])
    }, 2000)
  })
}

const formatter = {
  pattern: /^<name:([\w\W]+?),id:([\w\W]+?)>/,
  // render (id: string, name: string) {
  //   return <div contenteditable="false">{`${id} - ${name}`}</div>
  // }
  render: { scopedSlot: 'mention' },
  parser: (id: string, name: string) => `&lt;name:${name},id:${id}&gt;`
}
</script>
