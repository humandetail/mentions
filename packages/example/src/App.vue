<template>
  <div>
    Vue Mentions

    <div class="editor" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

onMounted(() => {
  const editor = createMentions({
    value: 'Hello #{value:张 三,key:1}，你好啊#{value:李 四,key:2}，这里是#{value:王 五,key:3}.\nWorld!',
    options: [
      { key: '1', value: '张 三', disabled: true },
      { key: '2', value: '李 四' },
      { key: '3', value: '王 五' },
      { key: '4', value: '赵 六' },
      { key: '5', value: '田 七' },
      { key: '6', value: '孙 八' },
      { key: '7', value: '金 九' },
      { key: '8', value: '银 十' }
    ],
    maxLength: 30
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
