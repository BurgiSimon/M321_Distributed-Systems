<script setup lang="ts"></script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Top nav -->
    <header class="sticky top-0 z-20 bg-[var(--bg)] border-b border-[var(--border)]">
      <nav class="max-w-6xl mx-auto px-3 py-3 flex items-center justify-between gap-4">
        <div class="text-lg font-semibold">MQTT Weather</div>
        <div class="flex gap-2">
          <RouterLink
            to="/"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)]"
            active-class="bg-[var(--surface-2)]"
            exact-active-class="bg-[var(--surface-2)]"
          >Main</RouterLink>
          <RouterLink
            to="/charts"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)]"
            active-class="bg-[var(--surface-2)]"
          >Charts</RouterLink>
          <RouterLink
            to="/log"
            class="px-3 py-1.5 rounded hover:bg-[var(--surface-2)]"
            active-class="bg-[var(--surface-2)]"
          >Log</RouterLink>
        </div>
      </nav>
    </header>

    <!-- Routed pages -->
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>
