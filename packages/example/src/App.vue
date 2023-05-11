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
  const editor = createMentions()
  console.log(editor)
  editor.mount('.editor')
})
</script>
