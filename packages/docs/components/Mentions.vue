<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

const inputValue = ref('')
const containerRef = ref()

const mentions = createMentions({
  value: '',
  options: [
    { id: '1', name: 'John' },
    { id: '2', name: 'Jack' },
    { id: '3', name: 'Tom' },
    { id: '4', name: 'Jerry' }
  ]
})

mentions.on('change', (value) => {
  inputValue.value = value
})

onMounted(() => {
  mentions.mount(containerRef.value)
})
</script>

<template>
  <div>
    <div ref="containerRef" />
    <p>output:</p>
    <output>{{ inputValue }}</output>
  </div>
</template>
