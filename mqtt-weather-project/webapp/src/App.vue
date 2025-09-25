<script setup lang="ts">
import { ref } from "vue";
import ConnectionStatus from "@/components/ConnectionStatus.vue";
import GradualBlur from "./components/GradualBlur.vue";
import TargetCursor from "./components/TargetCursor.vue";

const customcursor = ref(true);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top nav -->
    <header
      class="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--border)]"
    >
      <nav
        class="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between gap-4"
      >
        <div class="text-lg font-semibold cursor-target no-underline">
          <RouterLink
            to="/"
            class="cursor-target"
            style="color: inherit; text-decoration: none"
            >MQTT Weather</RouterLink
          >
        </div>

        <div class="flex items-center gap-3">
          <RouterLink
            to="/"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)] cursor-target"
            active-class="bg-[var(--surface-2)]"
            exact-active-class="bg-[var(--surface-2)]"
            style="color: inherit"
            >Main</RouterLink
          >

          <RouterLink
            to="/charts"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)] cursor-target"
            active-class="bg-[var(--surface-2)]"
            style="color: inherit"
            >Charts</RouterLink
          >

          <RouterLink
            to="/history"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)] cursor-target"
            active-class="bg-[var(--surface-2)]"
            style="color: inherit"
            >History</RouterLink
          >

          <!-- Always-visible status pill (also targets custom cursor) -->
          <ConnectionStatus
            label="MQTT"
            broker="ws://localhost:9001"
            class="cursor-target"
          />
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <TargetCursor
        :spin-duration="5"
        :hide-default-cursor="true"
        v-if="customcursor"
      />
      <RouterView />
    </main>
  </div>

  <!-- bottom blur pinned to viewport -->
  <GradualBlur
    target="page"
    position="bottom"
    preset="footer"
    height="3rem"
    :zIndex="25"
  />

  <button
    @click="customcursor = !customcursor"
    class="fixed bottom-15 right-4 px-3 py-2 cursor-target btn"
    :aria-pressed="customcursor"
    title="Toggle custom cursor"
  >
    {{ customcursor ? "Cursor: ON" : "Cursor: OFF" }}
  </button>
</template>
