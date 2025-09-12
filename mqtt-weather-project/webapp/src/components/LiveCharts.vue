<script setup lang="ts">
import { computed, PropType } from 'vue'
import {
  Chart, LineElement, PointElement, LineController,
  CategoryScale, LinearScale, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

Chart.register(LineElement, PointElement, LineController, CategoryScale, LinearScale, Tooltip, Legend, Filler)

type WeatherMsg = {
  stationId?: string
  temperature?: number | string
  humidity?: number | string
  timestamp?: string | number | Date
}

const props = defineProps({
  messages: { type: Array as PropType<WeatherMsg[]>, required: true },
  maxPoints: { type: Number, default: 240 } // ~ last 240 samples
})

/** helpers */
const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : null
}
const isBadTemp = (t: number | null) => t === null || t === -999 || t < -50 || t > 60
const isBadHum  = (h: number | null) => h === null || h < 0 || h > 100

// build chart arrays (chronological left→right)
const labels = computed(() => {
  const slice = props.messages.slice(0, props.maxPoints).reverse()
  return slice.map(m => {
    const d = m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp ?? Date.now())
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('de-CH', { hour12: false })
  })
})

const temps = computed(() => {
  const slice = props.messages.slice(0, props.maxPoints).reverse()
  return slice.map(m => {
    const t = toNum(m.temperature)
    return isBadTemp(t) ? null : t
  })
})

const hums = computed(() => {
  const slice = props.messages.slice(0, props.maxPoints).reverse()
  return slice.map(m => {
    const h = toNum(m.humidity)
    return isBadHum(h) ? null : h
  })
})

/** colors from your dark theme */
const styles = getComputedStyle(document.documentElement)
const colText   = styles.getPropertyValue('--text').trim()   || '#e7e7ea'
const colMut    = styles.getPropertyValue('--muted').trim()  || '#a0a0a8'
const colPrim   = styles.getPropertyValue('--primary').trim()|| '#60a5fa'
const colSucc   = styles.getPropertyValue('--success').trim()|| '#22c55e'
const gridColor = styles.getPropertyValue('--border').trim() || '#2a2b2f'

const tempData = computed(() => ({
  labels: labels.value,
  datasets: [{
    label: 'Temperature (°C)',
    data: temps.value,
    borderColor: colPrim,
    backgroundColor: colPrim + '33',
    spanGaps: false,
    tension: 0.25,
    pointRadius: 0,
    borderWidth: 2,
    fill: true,
  }]
}))

const humData = computed(() => ({
  labels: labels.value,
  datasets: [{
    label: 'Humidity (%)',
    data: hums.value,
    borderColor: colSucc,
    backgroundColor: colSucc + '33',
    spanGaps: false,
    tension: 0.25,
    pointRadius: 0,
    borderWidth: 2,
    fill: true,
  }]
}))

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 200 },
  plugins: {
    legend: { labels: { color: colText } },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
      callbacks: {
        // show gaps as "—"
        label: (ctx: any) => {
          const v = ctx.parsed.y
          if (v === null || Number.isNaN(v)) return `${ctx.dataset.label}: —`
          return `${ctx.dataset.label}: ${v}`
        }
      }
    }
  },
  scales: {
    x: {
      ticks: { color: colMut, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      grid: { color: gridColor }
    },
    y: {
      ticks: { color: colMut },
      grid: { color: gridColor }
    }
  }
}

const tempOptions = {
  ...baseOptions,
  scales: {
    ...baseOptions.scales,
    y: { ...(baseOptions.scales as any).y, suggestedMin: -10, suggestedMax: 35 }
  }
}

const humOptions = {
  ...baseOptions,
  scales: {
    ...baseOptions.scales,
    y: { ...(baseOptions.scales as any).y, min: 0, max: 100 }
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
    <div class="card p-3 h-56">
      <Line :data="tempData" :options="tempOptions" />
    </div>
    <div class="card p-3 h-56">
      <Line :data="humData" :options="humOptions" />
    </div>
  </div>
</template>

