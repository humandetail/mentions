<template>
  <div>
    Vue Mentions

    <div class="editor"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { createMentions } from '../../core'
import '../../core/src/assets/styles.scss'

onMounted(() => {
  const editor = createMentions({
    value: 'Hello #{name:张 三,id:1}，你好啊#{name:李 四,id:2}，这里是#{name:王 五,id:3}.\nWorld!',
    options: [
      { id: '1', name: '张 三' },
      { id: '2', name: '李 四' },
      { id: '3', name: '王 五' },
      { id: '4', name: '赵 六' },
      { id: '5', name: '田 七' },
      { id: '6', name: '孙 八' },
      { id: '7', name: '金 九' },
      { id: '8', name: '银 十' }
    ],
    optionsFetchApi: () => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve([
            { id: '1', name: 'R 张 三' },
            { id: '2', name: 'R 李 四' },
            { id: '3', name: 'R 王 五' },
            { id: '4', name: 'R 赵 六' },
            { id: '5', name: 'R 田 七' },
            { id: '6', name: 'R 孙 八' },
            { id: '7', name: 'R 金 九' },
            { id: '8', name: 'R 银 十' }
          ])
        }, 2000)
      })
    }
  })

  editor
    .on('change', (val) => {
      console.log('change', val)
    })
    .once('open', () => {
      console.log('open')
    })
    .on('close', () => {
      console.log('close')
    })
    .mount('.editor')
})
</script>
