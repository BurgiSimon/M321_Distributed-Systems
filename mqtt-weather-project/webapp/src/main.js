import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'  // keep your Tailwind import here

createApp(App).use(router).mount('#app')
