<script setup lang="ts">
import { onMounted, ref, computed } from "vue";
import { Line } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  LineElement, PointElement,
  CategoryScale, LinearScale
} from "chart.js";

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

type Reading = { ts: number; stationId: string; temperature: number | null; humidity: number | null };

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:3000";

// UI state
const stations = ref<Array<{ stationId: string; firstTs: number; lastTs: number; count: number }>>([]);
const stationId = ref<string>("");
const limit = ref<number>(1000);

// default: last 2h
const now = () => new Date();
const toIsoLocal = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const MM = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mm = pad(d.getMinutes());
  return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
};
const to = ref<string>(toIsoLocal(now()));
const from = ref<string>(toIsoLocal(new Date(now().getTime() - 2 * 60 * 60 * 1000)));

const loading = ref(false);
const errorMsg = ref<string>("");

const data = ref<Reading[]>([]);

async function fetchStations() {
  const res = await fetch(`${API_BASE}/api/stations`);
  if (!res.ok) return;
  const rows = await res.json();
  stations.value = rows;
  if (!stationId.value && rows.length) {
    stationId.value = rows[0].stationId;
  }
}

function parseLocalDT(s: string) {
  // input type="datetime-local" returns "YYYY-MM-DDTHH:mm"
  return new Date(s).getTime();
}

async function fetchHistory() {
  errorMsg.value = "";
  data.value = [];
  if (!stationId.value) {
    errorMsg.value = "Please select a station.";
    return;
  }
  loading.value = true;
  try {
    const params = new URLSearchParams({
      stationId: stationId.value,
      from: String(parseLocalDT(from.value)),
      to: String(parseLocalDT(to.value)),
      limit: String(limit.value),
    });
    const res = await fetch(`${API_BASE}/api/history?` + params.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = (await res.json()) as Reading[];
    data.value = rows;
  } catch (e: any) {
    errorMsg.value = e?.message ?? "Fetch failed";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchStations();
  if (stationId.value) await fetchHistory();
});

const labels = computed(() =>
  data.value.map(r => new Date(r.ts).toLocaleString("de-CH", { hour12: false }))
);

const isBadTemp = (t: number | null | undefined) =>
  t == null || t === -999 || t < -50 || t > 60;

const isBadHum = (h: number | null | undefined) =>
  h == null || h < 0 || h > 100;

const temps = computed(() =>
  data.value.map(r => (isBadTemp(r.temperature) ? null : r.temperature))
);

const hums = computed(() =>
  data.value.map(r => (isBadHum(r.humidity) ? null : r.humidity))
);

/** colors from your dark theme */
const styles = getComputedStyle(document.documentElement)
const colText   = styles.getPropertyValue('--text').trim()   || '#e7e7ea'
const colMut    = styles.getPropertyValue('--muted').trim()  || '#a0a0a8'
const colPrim   = styles.getPropertyValue('--primary').trim()|| '#60a5fa'
const colSucc   = styles.getPropertyValue('--success').trim()|| '#22c55e'
const gridColor = styles.getPropertyValue('--border').trim() || '#2a2b2f'

const skipped = (ctx, value) => ctx.p0.skip || ctx.p1.skip ? value : undefined;




const tempChartData = computed(() => ({
  labels: labels.value,
  datasets: [{
    label: 'Temperature (°C)',
    data: temps.value,
    borderColor: colPrim,
    backgroundColor: colPrim + '33',
    spanGaps: true,
    tension: 0.25,
    pointRadius: 0,
    borderWidth: 2,
    fill: true,
    segment: {
        borderColor: ctx => skipped(ctx, 'rgba(234,2,2,0.7)'),
        borderDash: ctx => skipped(ctx, [6, 6]),
    },
  }]
}))

const humChartData = computed(() => ({
  labels: labels.value,
  datasets: [{
    label: 'Humidity (%)',
    data: hums.value,
    borderColor: colSucc,
    backgroundColor: colSucc + '33',
    spanGaps: true,
    tension: 0.25,
    pointRadius: 0,
    borderWidth: 2,
    fill: true,
    segment: {
        borderColor: ctx => skipped(ctx, 'rgba(234,2,2,0.7)'),
        borderDash: ctx => skipped(ctx, [6, 6]),
    },
  }]
}))

const commonOpts = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: { display: true },
    title: { display: false }
  },
  scales: {
    x: { ticks: { maxRotation: 0, autoSkip: true } },
    y: { beginAtZero: false }
  }
};
</script>

<template>
  <div class="p-4 max-w-6xl mx-auto space-y-6 pb-20">
    <h1 class="text-2xl font-bold cursor-target w-min p-1">History</h1>

    <div class="grid gap-3 md:grid-cols-6 items-end">
      <label class="flex flex-col md:col-span-1">
        <span class="text-sm opacity-80 mb-1">Station</span>
        <select v-model="stationId" class="select px-3 py-2 cursor-target">
          <option v-for="s in stations" :key="s.stationId" :value="s.stationId">
            {{ s.stationId }} ({{ s.count }})
          </option>
        </select>
      </label>

      <label class="flex flex-col md:col-span-2">
        <span class="text-sm opacity-80 mb-1">From</span>
        <input v-model="from" type="datetime-local" class="select px-3 py-2 cursor-target" />
      </label>

      <label class="flex flex-col md:col-span-2">
        <span class="text-sm opacity-80 mb-1">To</span>
        <input v-model="to" type="datetime-local" class="select px-3 py-2 cursor-target" />
      </label>

      <label class="flex flex-col">
        <span class="text-sm opacity-80 mb-1">Limit</span>
        <input v-model.number="limit" type="number" min="1" max="10000" class="select px-3 py-2 cursor-target" />
      </label>

      <button @click="fetchHistory" class="md:col-span-6 px-4 py-2 btn cursor-target">
        {{ loading ? "Loading…" : "Load history" }}
      </button>
    </div>

    <p v-if="errorMsg" class="text-red-500">{{ errorMsg }}</p>

    <div class="grid md:grid-cols-1 gap-6 select">
      <div class="h-64 md:h-80  rounded p-2 cursor-target">
        <Line :data="tempChartData" :options="commonOpts" />
      </div>
      <div class="h-64 md:h-80  rounded p-2 cursor-target">
        <Line :data="humChartData" :options="commonOpts" />
      </div>
    </div>

    <div class="overflow-auto border rounded select">
      <table class="w-full text-sm">
        <thead class="bg-black/5 cursor-target">
          <tr>
            <th class="text-left p-2">Time</th>
            <th class="text-left p-2">Station</th>
            <th class="text-left p-2">Temp (°C)</th>
            <th class="text-left p-2">Humidity (%)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in data" :key="r.ts + '-' + r.stationId" class="border-t cursor-target">
            <td class="p-2">{{ new Date(r.ts).toLocaleString("de-CH", { hour12: false }) }}</td>
            <td class="p-2">{{ r.stationId }}</td>
            <td class="p-2">{{ r.temperature ?? "—" }}</td>
            <td class="p-2">{{ r.humidity ?? "—" }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
/* optional minor tweaks */
</style>
