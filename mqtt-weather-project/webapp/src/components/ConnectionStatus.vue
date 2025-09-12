<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { client } from '../mqttClient' // uses your existing exported client

type Status = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error'

interface Props {
  /** Optional label shown after the status dot */
  label?: string
  /** Optional broker name/url to display in a muted way */
  broker?: string
  /** Compact mode (hides broker and extra spacing) */
  compact?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  label: 'MQTT',
  broker: '',
  compact: false,
})

const status = ref<Status>('connecting')
const lastError = ref<string | null>(null)
const connects = ref(0)
const reconnects = ref(0)

const styles = computed(() => {
  switch (status.value) {
    case 'connected':
      return {
        wrap: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        dot: 'bg-emerald-400',
        pulse: '',
        text: 'Connected',
      }
    case 'reconnecting':
      return {
        wrap: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-400',
        pulse: 'animate-pulse',
        text: 'Reconnecting…',
      }
    case 'connecting':
      return {
        wrap: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        dot: 'bg-amber-400',
        pulse: 'animate-pulse',
        text: 'Connecting…',
      }
    case 'error':
      return {
        wrap: 'bg-red-500/10 text-red-400 border border-red-500/30',
        dot: 'bg-red-400',
        pulse: '',
        text: 'Error',
      }
    default: // 'disconnected'
      return {
        wrap: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
        dot: 'bg-rose-400',
        pulse: '',
        text: 'Disconnected',
      }
  }
})

function attach() {
  // initialize from current state if possible
  status.value = client.connected ? 'connected' : 'connecting'

  const onConnect = () => {
    status.value = 'connected'
    lastError.value = null
    connects.value++
  }
  const onReconnect = () => {
    status.value = 'reconnecting'
    reconnects.value++
  }
  const onClose = () => {
    // mqtt.js emits 'close' when the connection is fully closed
    status.value = 'disconnected'
  }
  // mqtt@5 also emits 'disconnect' (server-sent), handle both safely:
  const onDisconnect = () => {
    status.value = 'disconnected'
  }
  const onError = (err: Error) => {
    lastError.value = err?.message || 'Unknown error'
    status.value = 'error'
  }

  client.on('connect', onConnect)
  client.on('reconnect', onReconnect)
  client.on('close', onClose)
  // @ts-ignore (present on mqtt v5)
  client.on?.('disconnect', onDisconnect)
  client.on('error', onError)

  return () => {
    client.off('connect', onConnect)
    client.off('reconnect', onReconnect)
    client.off('close', onClose)
    // @ts-ignore
    client.off?.('disconnect', onDisconnect)
    client.off('error', onError)
  }
}

let detach: null | (() => void) = null
onMounted(() => { detach = attach() })
onBeforeUnmount(() => { detach?.() })

function retry() {
  try {
    // force immediate reconnect attempt
    // @ts-ignore — mqtt client has reconnect()
    client.reconnect?.()
    status.value = 'reconnecting'
  } catch { /* ignore */ }
}
</script>

<template>
  <div
    class="inline-flex items-center gap-2 rounded-xl px-2.5 py-1.5 select-none"
    :class="styles.wrap"
    aria-live="polite"
  >
    <span class="h-2.5 w-2.5 rounded-full" :class="[styles.dot, styles.pulse]" />
    <span class="text-sm">
      <strong class="font-medium">{{ label }}</strong>
      <span class="mx-1">•</span>
      <span>{{ styles.text }}</span>
      <span v-if="reconnects > 0" class="opacity-70"> ({{ reconnects }}×)</span>
    </span>

    <span v-if="broker && !compact" class="text-xs opacity-70 pl-1">
      {{ broker }}
    </span>


    <span v-if="lastError && !compact" class="text-xs opacity-80 pl-2">
      — {{ lastError }}
    </span>
  </div>
</template>
