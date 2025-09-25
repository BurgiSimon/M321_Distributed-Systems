import { createRouter, createWebHistory } from 'vue-router'

// Main page uses your existing component
import WeatherFeed from '@/components/WeatherFeed.vue'
// New pages:
import ChartsPage from '@/pages/ChartsPage.vue'
import HistoryPage from '@/pages/HistoryPage.vue'

const routes = [
  { path: '/', name: 'home', component: WeatherFeed },
  { path: '/charts', name: 'charts', component: ChartsPage },
  { path: "/history", name: "history", component: HistoryPage},
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

