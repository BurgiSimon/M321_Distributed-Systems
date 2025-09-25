<script setup lang="ts">
import LiveCharts from "./LiveCharts.vue";
import { useWeather } from "@/composables/useWeather";
import GradualBlur from "./GradualBlur.vue";

type WeatherMsg = {
  stationId?: string;
  temperature?: number | string;
  humidity?: number | string;
  timestamp?: string | number | Date;
};

const { messages, normalized } = useWeather();

const tz = "Europe/Zurich";
const chFormatter = new Intl.DateTimeFormat("de-CH", {
  timeZone: tz,
  hour12: false,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});
function formatCH(ts: WeatherMsg["timestamp"]) {
  const d = ts instanceof Date ? ts : new Date(ts ?? Date.now());
  return Number.isNaN(d.getTime())
    ? "—"
    : chFormatter.format(d).replace(",", "");
}
const fmt = (n: number | null, digits = 1) =>
  n === null || !Number.isFinite(n) ? "—" : n.toFixed(digits);
</script>

<template>

  <div class="mx-2 pb-20">
    <div class="">
      <LiveCharts :messages="messages" :maxPoints="240" />
    </div>

    <div class="overflow-auto">
      <ul class="">
        <li
          v-for="(m, i) in normalized"
          :key="i"
          class="py-3 flex items-baseline gap-3 border-b-2 border-neutral-800"
        >
          <span
            class="w-10 shrink-0 text-right text-xs opacity-60 tabular-nums select-none"
          >
            {{ normalized.length - i }}
          </span>

          <div class="flex flex-wrap gap-x-2 gap-y-1">
            <strong class="cursor-target p-1.5">{{
              m.stationId ?? "unknown"
            }}</strong>

            <span
              class="cursor-target p-1.5"
              :class="m.badTemp ? 'text-red-400' : ''"
              :title="m.badTemp ? `Temperature ${m.reasonTemp}` : ''"
            >
              {{ fmt(m.t) }}°C
              <span
                v-if="m.badTemp"
                class="ml-1 align-middle text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400"
                >bad</span
              >
            </span>

            <span
              class="cursor-target p-1.5"
              :class="m.badHumidity ? 'text-red-400' : ''"
              :title="m.badHumidity ? `Humidity ${m.reasonHumidity}` : ''"
            >
              {{ fmt(m.h, 0) }}%
              <span
                v-if="m.badHumidity"
                class="ml-1 align-middle text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400"
                >bad</span
              >
            </span>

            <small class="opacity-70 py-1.5 ml-1"
              >@ {{ formatCH(m.timestamp) }}</small
            >
          </div>
        </li>
      </ul>
    </div>
  </div>

</template>

<style>
li {
  border-color: #262626;
}
</style>
