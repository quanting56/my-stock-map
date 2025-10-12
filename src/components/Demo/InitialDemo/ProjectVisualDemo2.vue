<template>
  <div :data-theme="isDark ? 'dark' : 'light'" class="min-h-screen bg-theme text-theme transition-colors duration-500">
    <!-- Header -->
    <header class="flex justify-between items-center px-6 py-4 border-b card-theme">
      <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">My Stock Map</h1>
      <button
        @click="isDark = !isDark"
        class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)] transition"
      >
        {{ isDark ? '🌞 日間模式' : '🌙 夜間模式' }}
      </button>
    </header>

    <!-- Main Layout -->
    <div class="grid grid-cols-12 gap-6 p-6">
      <!-- Sidebar -->
      <aside class="col-span-3 card-theme rounded-2xl p-4 shadow-md">
        <nav class="space-y-2">
          <a href="#" class="block px-3 py-2 rounded-md hover:bg-[color:var(--color-border)] transition">🏠 Dashboard</a>
          <a href="#" class="block px-3 py-2 rounded-md hover:bg-[color:var(--color-border)] transition">📊 Portfolio</a>
          <a href="#" class="block px-3 py-2 rounded-md hover:bg-[color:var(--color-border)] transition">📈 Reports</a>
          <a href="#" class="block px-3 py-2 rounded-md hover:bg-[color:var(--color-border)] transition">⚙️ Settings</a>
        </nav>
      </aside>

      <!-- Main -->
      <main class="col-span-9 space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-3 gap-4">
          <div class="card-theme rounded-xl p-4 shadow text-center">
            <p class="text-sm text-[color:var(--color-secondary)]">總市值</p>
            <p class="text-xl font-bold text-[color:var(--color-primary)]">$1,234,567</p>
          </div>
          <div class="card-theme rounded-xl p-4 shadow text-center">
            <p class="text-sm text-[color:var(--color-secondary)]">今日損益</p>
            <p class="text-xl font-bold text-[color:var(--color-line2)]">-2.3%</p>
          </div>
          <div class="card-theme rounded-xl p-4 shadow text-center">
            <p class="text-sm text-[color:var(--color-secondary)]">現金部位</p>
            <p class="text-xl font-bold text-[color:var(--color-line3)]">28%</p>
          </div>
        </div>

        <!-- Chart Placeholder -->
        <div class="card-theme rounded-2xl p-6 h-[300px] flex items-center justify-center shadow-inner">
          <p class="text-[color:var(--color-secondary)]">📉 Chart Area (D3.js)</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isDark = ref(false)
</script>
