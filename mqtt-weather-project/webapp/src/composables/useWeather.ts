// src/composables/useWeather.ts
import { ref, readonly, onMounted } from 'vue'
import { client } from '@/mqttClient'

export interface WeatherMsg {
  stationId?: string
  temperature?: number | string
  humidity?: number | string
  timestamp?: string | number | Date
}

const TOPIC = 'weather'
const messages = ref<WeatherMsg[]>([])   // ✅ ref (not shallowRef)
let attached = false

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
      // ✅ immutable update so Vue notices
      messages.value = [data, ...messages.value].slice(0, 1000)
    } catch (e) {
      console.warn('Bad JSON:', e)
    }
  }

  client.on('connect', onConnect)
  client.on('message', onMessage)
  if (client.connected) onConnect()
}

export function useWeather() {
  onMounted(attach)
  return { messages: readonly(messages) }
}
