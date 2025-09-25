<script setup lang="ts">
import { computed, ref } from 'vue'
import { useWeather } from '@/composables/useWeather'
import LiveCharts from '@/components/LiveCharts.vue'

type WeatherMsg = {
  stationId?: string;
  temperature?: number | string;
  humidity?: number | string;
  timestamp?: string | number | Date;
}

const { messages } = useWeather()

const stations = computed(() => {
  const set = new Set<string>()
  for (const m of messages.value) set.add(String(m.stationId ?? 'unknown'))
  return Array.from(set).sort()
})

const selected = ref<string>('All')

const filtered = computed<WeatherMsg[]>(() => {
  if (selected.value === 'All') return messages.value
  return messages.value.filter(m => String(m.stationId ?? 'unknown') === selected.value)
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-3 py-4 pb-20">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
      <h1 class="text-3xl cursor-target">Charts</h1>
      <div class="flex items-center gap-2">
        <label class="text-sm opacity-80">Station:</label>
        <select v-model="selected" class="select cursor-target">
          <option>All</option>
          <option v-for="s in stations" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
    </div>

    <!-- Current selection (global or station) -->
    <div class="mb-6">
      <LiveCharts :messages="filtered" :maxPoints="240" />
    </div>

    <!-- Mini charts per station -->
    <div class="mt-8">
      <h2 class="text-xl mb-3">Per station</h2>
      <div class="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div v-for="s in stations" :key="s" class="card p-3">
          <div class="mb-2 flex items-center justify-between">
            <strong>{{ s }}</strong>
          </div>
          <LiveCharts
            :messages="messages.filter(m => String(m.stationId ?? 'unknown') === s)"
            :maxPoints="180"
          />
        </div>
      </div>
    </div>
  </div>
</template>
