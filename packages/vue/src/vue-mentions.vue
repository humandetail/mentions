<template>
  <div ref="Mentions">
    213
  </div>
</template>

<script>
import { createMentions } from '@mentions/vanilla'
import '@mentions/vanilla/mentions.css'

export default {
  name: 'VueMentions',

  props: {
    value: {
      type: String,
      default: ''
    }
  },

  mounted () {
    this.mentions = createMentions({
      // options: [
      //   { id: '1', name: '张三' }
      // ]
    })
    console.log(this.mentions)
    this.mentions.mount(this.$refs.Mentions)
  }
}
</script>
