<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { client } from "../mqttClient";
import TargetCursor from "./TargetCursor.vue";
import ConnectionStatus from "./ConnectionStatus.vue";
import GradualBlur from "./GradualBlur.vue";
import LiveCharts from "./LiveCharts.vue";

type WeatherMsg = {
  stationId?: string;
  temperature?: number | string;
  humidity?: number | string;
  timestamp?: string | number | Date;
};

// ---- Configurable sanity limits ----
const TEMP_MIN = -50;
const TEMP_MAX = 60;
const TEMP_SENTINELS = new Set<number>([-999]);
const HUM_MIN = 0;
const HUM_MAX = 100;

type Row = WeatherMsg & {
  t: number | null;
  h: number | null;
  badTemp: boolean;
  badHumidity: boolean;
  reasonTemp?: string;
  reasonHumidity?: string;
};

const messages = ref<Row[]>([]);

/** --- Swiss time formatting (Europe/Zurich) --- */
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
  if (Number.isNaN(d.getTime())) return "—";
  return chFormatter.format(d).replace(",", "");
}

// --- normalize + flag incoming data ---
const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "string" ? parseFloat(v) : Number(v);
  return Number.isFinite(n) ? n : null;
};

function normalizeAndFlag(data: WeatherMsg): Row {
  const t = toNum(data.temperature);
  const h = toNum(data.humidity);

  let badTemp = false, reasonTemp: string | undefined;
  if (t === null) { badTemp = true; reasonTemp = "missing"; }
  else if (TEMP_SENTINELS.has(t)) { badTemp = true; reasonTemp = "sentinel"; }
  else if (t < TEMP_MIN || t > TEMP_MAX) { badTemp = true; reasonTemp = `out of range (${TEMP_MIN}…${TEMP_MAX})`; }

  let badHumidity = false, reasonHumidity: string | undefined;
  if (h === null) { badHumidity = true; reasonHumidity = "missing"; }
  else if (h < HUM_MIN || h > HUM_MAX) { badHumidity = true; reasonHumidity = `out of range (${HUM_MIN}…${HUM_MAX})`; }

  return { ...data, t, h, badTemp, badHumidity, reasonTemp, reasonHumidity };
}

const fmt = (n: number | null, digits = 1) =>
  n === null || !Number.isFinite(n) ? "—" : n.toFixed(digits);

onMounted(() => {
  client.on("connect", () => {
    client.subscribe("weather", (err?: Error) => {
      if (err) console.error("Subscribe error:", err);
    });
  });

  client.on("message", (topic: string, payload: Uint8Array) => {
    if (topic !== "weather") return;
    try {
      const raw = JSON.parse(new TextDecoder().decode(payload)) as WeatherMsg;
      const row = normalizeAndFlag(raw);
      messages.value.unshift(row);
      if (messages.value.length > 1000) messages.value.pop();
    } catch (e) {
      console.warn("Bad JSON:", e);
    }
  });
});

onBeforeUnmount(() => {
  // optional: client.end()
});
</script>

<template>
  <TargetCursor :spin-duration="5" :hide-default-cursor="true" />

  <div class="mx-2 h-screen flex flex-col">
    <!-- sticky header -->
    <div class="sticky top-0 z-10 bg-[var(--bg)]">
      <div class="flex items-center justify-between py-4 gap-4">
        <h1 class="text-5xl cursor-target">Live Weather</h1>
        <ConnectionStatus
          label="MQTT"
          broker="ws://localhost:9001"
          class="cursor-target"
        />
      </div>
    </div>

    <!-- live charts -->
    <div class="py-3 cursor-target">
      <!-- LiveCharts treats invalid readings as gaps -->
      <LiveCharts :messages="messages" :maxPoints="240" />
    </div>

    <!-- scrollable list -->
    <div class="flex-1 overflow-y-auto">
      <ul class="space-y-2">
        <li
          v-for="(m, i) in messages"
          :key="i"
          class="py-3 flex items-baseline gap-3 border-b-2 border-neutral-800"
        >
          <!-- aligned index -->
          <span class="w-10 shrink-0 text-right text-xs opacity-60 tabular-nums select-none">
            {{ messages.length - i }}
          </span>

          <!-- content -->
          <div class="flex flex-wrap gap-x-2 gap-y-1">
            <strong class="cursor-target p-1.5">{{ m.stationId ?? "unknown" }}</strong>

            <!-- temperature -->
            <span
              class="cursor-target p-1.5"
              :class="m.badTemp ? 'text-red-400' : ''"
              :title="m.badTemp ? `Temperature ${m.reasonTemp}` : ''"
            >
              {{ fmt(m.t) }}°C
              <span
                v-if="m.badTemp"
                class="ml-1 align-middle text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400"
              >bad</span>
            </span>


            <!-- humidity -->
            <span
              class="cursor-target p-1.5"
              :class="m.badHumidity ? 'text-red-400' : ''"
              :title="m.badHumidity ? `Humidity ${m.reasonHumidity}` : ''"
            >
              {{ fmt(m.h, 0) }}%
              <span
                v-if="m.badHumidity"
                class="ml-1 align-middle text-[10px] px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/10 text-red-400"
              >bad</span>
            </span>

            <!-- timestamp -->
            <small class="opacity-70 py-1.5 ml-1">
              @ {{ formatCH(m.timestamp) }}
            </small>
          </div>
        </li>
      </ul>
    </div>

    <GradualBlur>
      <div
        class="gradual-blur relative isolate gradual-blur-parent"
        style="
          position: absolute;
          pointer-events: none;
          opacity: 1;
          z-index: 10;
          width: 100%;
          height: 3rem;
          bottom: 0;
          left: 0;
          right: 0;
        "
      />
    </GradualBlur>
  </div>
</template>

<style>
li { border-color: #262626; }
</style>
