<script setup lang="ts">
import { useWeather } from '@/composables/useWeather'

type WeatherMsg = {
  stationId?: string;
  temperature?: number | string;
  humidity?: number | string;
  timestamp?: string | number | Date;
}

const { messages } = useWeather()

const tz = "Europe/Zurich"
const ch = new Intl.DateTimeFormat("de-CH", {
  timeZone: tz, hour12: false,
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  year: "2-digit", month: "2-digit", day: "2-digit",
})
function formatCH(ts: WeatherMsg["timestamp"]) {
  const d = ts instanceof Date ? ts : new Date(ts ?? Date.now())
  return isNaN(d.getTime()) ? "—" : ch.format(d).replace(",", "")
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-3 py-4 h-[calc(100vh-64px)] flex flex-col">
    <h1 class="text-3xl mb-4">Weather Log</h1>

    <div class="flex-1 overflow-y-auto">
      <ul class="space-y-2">
        <li
          v-for="(m, i) in messages"
          :key="i"
          class="py-3 flex items-baseline gap-3 border-b-2 border-neutral-800"
        >
          <span class="w-10 shrink-0 text-right text-xs opacity-60 tabular-nums select-none">
            {{ messages.length - i }}
          </span>

          <div class="flex flex-wrap gap-x-2 gap-y-1">
            <strong class="p-1.5">{{ m.stationId ?? "unknown" }}</strong>
            <span class="py-1.5">
              {{ m.temperature }}°C, {{ m.humidity }}%
              <small class="opacity-70 py-1.5 ml-1">@ {{ formatCH(m.timestamp) }}</small>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style>
li { border-color: #262626; }
</style>
