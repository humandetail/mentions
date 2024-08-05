<template>
  <div>
    Vanilla Mentions

    <div class="editor" />

    <p>Plain Value:</p>
    <p>{{ value }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

const value = ref('')

onMounted(() => {
  const editor = createMentions({
    prefix: '@',
    labelFieldName: 'title',
    valueFieldName: 'field',
    value: 'Hello @{title:张 三,field:1}，你好啊@{title:李 四,field:2}，这里是@{title:王 五,field:3}.\nWorld!',
    options: [
      { field: '1', title: '张 三', disabled: true },
      { field: '2', title: '李 四' },
      { field: '3', title: '王 五' },
      { field: '4', title: '赵 六' },
      { field: '5', title: '田 七' },
      { field: '6', title: '孙 八' },
      { field: '7', title: '金 九' },
      { field: '8', title: '银 十' }
    ],
    maxLength: 100
    // optionsFetchApi: () => {
    //   return new Promise(resolve => {
    //     setTimeout(() => {
    //       resolve([
    //         { key: '1', value: 'R 张 三' },
    //         { key: '2', value: 'R 李 四' },
    //         { key: '3', value: 'R 王 五' },
    //         { key: '4', value: 'R 赵 六' },
    //         { key: '5', value: 'R 田 七' },
    //         { key: '6', value: 'R 孙 八' },
    //         { key: '7', value: 'R 金 九' },
    //         { key: '8', value: 'R 银 十' }
    //       ])
    //     }, 2000)
    //   })
    // }
  })

  // setTimeout(() => {
  //   editor.set('value', 'Hello world\n你好啊')
  //     .set('options', [
  //       { key: '1', value: '张三' }
  //     ])
  //     .set('max-length', 10)
  // }, 3000)

  editor
    .on('change', (newVal, oldVal) => {
      console.log('change', newVal, oldVal)
      value.value = newVal
    })
    .once('open', () => {
      console.log('open')
    })
    .on('close', () => {
      console.log('close')
    })
    .on('mentions-change', (newMentions, oldMentions) => {
      console.log(newMentions, oldMentions)
    })
    .mount('.editor')
})
</script>
