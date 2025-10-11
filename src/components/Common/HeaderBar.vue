<template>
  <!-- Header -->
  <header class="card-theme flex items-center justify-between px-6 py-3 border-b">
    <div class="flex items-center space-x-2">
      <div class="text-xl font-bold text-[color:var(--color-primary)]">📊 My Stock Map</div>
    </div>
    <div class="flex items-center space-x-4">
      <input
        type="text"
        placeholder="搜尋股票..."
        class="px-3 py-1 border rounded-lg text-sm bg-[color:var(--color-card)] text-theme border-theme focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
      />
      <button class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">登入</button>
      <button
        @click="uiTheme.toggleUITheme"
        class="px-3 py-1 text-sm rounded-lg border card-theme hover:bg-[color:var(--color-border)] transition cursor-pointer"
      >
        {{ uiTheme.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
      </button>
    </div>
  </header>
</template>

<script setup>
import { useUIThemeStore } from "@/store/theme";

const uiTheme = useUIThemeStore();
</script>

<style scoped></style>
