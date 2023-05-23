import { createApp } from 'vue'
import VueMentions from './vue-mentions.vue'

const app = createApp(VueMentions)

app.mount(document.querySelector('#app')!)

export default {
  VueMentions
}
