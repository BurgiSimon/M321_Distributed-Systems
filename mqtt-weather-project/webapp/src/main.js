import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles.css'
import { useWeather } from './composables/useWeather'

createApp(App).use(router).mount('#app')

useWeather()