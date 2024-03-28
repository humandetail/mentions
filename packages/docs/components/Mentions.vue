<template>
  <div>
    <Options
      @change="handleChange"
    />

    <div ref="containerRef" />

    <p>输出:</p>
    <output>{{ inputValue }}</output>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { createMentions } from 'mentions.js'
import 'mentions.js/mentions.css'

import Options from './Options.vue'

const inputValue = ref('')
const containerRef = ref()

const dropdownOptions = ref([
  { id: '1', name: 'John' },
  { id: '2', name: 'Jack' },
  { id: '3', name: 'Tom' },
  { id: '4', name: 'Jerry' }
])

const mentionOptions = ref({
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
})

let mentions = createMentions(mentionOptions.value)

mentions.on('change', (value) => {
  inputValue.value = value
})

onMounted(() => {
  mentions.mount(containerRef.value)
})

const handleChange = (mOptions, dOptions) => {
  dropdownOptions.value = dOptions.filter(item => item.id && item.name)

  mentionOptions.value = {
    ...mOptions,
    options: dropdownOptions.value
  }

  if (mentions) {
    mentions.destroy()
    inputValue.value = ''
    mentions = createMentions(mentionOptions.value)
    mentions.mount(containerRef.value)
    mentions.on('change', (value) => {
      inputValue.value = value
    })
  }
}
</script>
