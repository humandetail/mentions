<template>
  <div>
    <Options
      @update:mention-options="mentionOptions = $event"
      @update:dropdown-options="dropdownOptions = $event"
    />

    <div ref="containerRef" />

    <p>输出:</p>
    <output>{{ inputValue }}</output>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { MentionOptions, createMentions } from 'mentions.js'
import { MentionDropdownListOption } from 'mentions.js/src/libs/renderer'
import 'mentions.js/mentions.css'

import Options from './Options.vue'

const inputValue = ref('')
const containerRef = ref()

const dropdownOptions = ref<MentionDropdownListOption[]>([
  { id: '1', name: 'John' },
  { id: '2', name: 'Jack' },
  { id: '3', name: 'Tom' },
  { id: '4', name: 'Jerry' }
])

const mentionOptions = computed<MentionOptions>(() => {
  return {
    type: 'input',
    value: '',
    initialValue: '',
    disabled: false,
    readonly: false,
    prefix: '@',
    suffix: '',
    maxLength: 0,
    getMentionLength: null,
    showStatistics: null,
    formatter: null,
    options: dropdownOptions.value,
    labelFieldName: 'name',
    valueFieldName: 'id',
    optionsFetchApi: null,
    immediate: false,
    filterOption: (option, filterValue) => option.name.toLowerCase().includes(filterValue.toLowerCase()),
    dropdownMaxWidth: null,
    dropdownMaxHeight: 200
  }
})

const mentions = createMentions(mentionOptions.value)

mentions.on('change', (value) => {
  inputValue.value = value
})

onMounted(() => {
  mentions.mount(containerRef.value)
})
</script>
