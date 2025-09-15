import { ref, readonly, computed, onMounted } from 'vue'
import { client } from '@/mqttClient'

export interface WeatherMsg {
  stationId?: string
  temperature?: number | string
  humidity?: number | string
  timestamp?: string | number | Date
}

/** Config */
const TOPIC = 'weather'
const MAX_LEN_DEFAULT = 1000
const TEMP_MIN = -50
const TEMP_MAX = 60
const TEMP_SENTINELS = new Set<number>([-999, -99.9, 999, 9999])
const HUM_MIN = 0
const HUM_MAX = 100

/** State (module-scoped -> survives route changes) */
const messages = ref<WeatherMsg[]>([])
const maxLen = ref(MAX_LEN_DEFAULT)
let attached = false

/** Helpers */
const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined) return null
  const n = typeof v === 'string' ? parseFloat(v) : Number(v)
  return Number.isFinite(n) ? n : null
}

/** Attach once */
function attach() {
  if (attached) return
  attached = true

  const onConnect = () => {
    client.subscribe(TOPIC, (err?: Error) => {
      if (err) console.error('Subscribe error:', err)
    })
  }

  const onMessage = (topic: string, payload: Uint8Array) => {
    if (topic !== TOPIC) return
    try {
      const data = JSON.parse(new TextDecoder().decode(payload)) as WeatherMsg
      // Ensure timestamp exists
      if (!data.timestamp) data.timestamp = new Date().toISOString()
      // Immutable update so Vue picks it up everywhere
      messages.value = [data, ...messages.value].slice(0, maxLen.value)
    } catch (e) {
      console.warn('Bad JSON:', e)
    }
  }

  client.on('connect', onConnect)
  client.on('message', onMessage)
  if (client.connected) onConnect()
}

/** Public API */
export function useWeather() {
  onMounted(attach)

  // Normalized + flagged rows for feed rendering
  const normalized = computed(() =>
    messages.value.map((m) => {
      const t = toNum(m.temperature)
      const h = toNum(m.humidity)

      let badTemp = false, reasonTemp: string | undefined
      if (t === null) { badTemp = true; reasonTemp = 'missing' }
      else if (TEMP_SENTINELS.has(t)) { badTemp = true; reasonTemp = 'sentinel' }
      else if (t < TEMP_MIN || t > TEMP_MAX) { badTemp = true; reasonTemp = `out of range (${TEMP_MIN}…${TEMP_MAX})` }

      let badHumidity = false, reasonHumidity: string | undefined
      if (h === null) { badHumidity = true; reasonHumidity = 'missing' }
      else if (h < HUM_MIN || h > HUM_MAX) { badHumidity = true; reasonHumidity = `out of range (${HUM_MIN}…${HUM_MAX})` }

      return { ...m, t, h, badTemp, badHumidity, reasonTemp, reasonHumidity }
    })
  )

  // Stations / quick filters
  const stations = computed(() => {
    const set = new Set<string>()
    for (const m of messages.value) set.add(String(m.stationId ?? 'unknown'))
    return Array.from(set).sort()
  })

  return {
    /** raw stream (use for charts) */
    messages: readonly(messages),
    /** normalized + flags (use for feed) */
    normalized,
    stations,
    maxLen,
    /** utils */
    clear: () => { messages.value = [] },
    setMax: (n: number) => { maxLen.value = Math.max(1, n | 0) }
  }
}