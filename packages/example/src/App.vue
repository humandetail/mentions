<template>
  <div>
    Vue Mentions

    <VueMentions
      type="textarea"
      :value="value"
      :options="options"
      :dropdownMaxWidth="100"
      :dropdownMaxHeight="200"
      @change="value = $event"
    />
  </div>
</template>

<script setup lang="ts">
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
  ''
)
</script>
