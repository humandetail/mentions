<template>
  <div ref="Mentions">
    213
  </div>
</template>

<script>
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

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
      //   { key: '1', value: '张三' }
      // ]
    })
    console.log(this.mentions)
    this.mentions.mount(this.$refs.Mentions)
  }
}
</script>
