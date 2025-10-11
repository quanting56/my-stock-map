<template>
  <nav class="flex flex-col space-y-2">
    <button
      v-for="tab in uiState.tabs"
      :key="tab.id"
      @click="uiState.setTab(tab.id)"
      :class="[
        'text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition cursor-pointer',
        tab.id === uiState.activeTab
          ? 'font-semibold'
          : ''
      ]"
    >
      {{ tab.icon }} {{ tab.title }}
    </button>
  </nav>
</template>

<script setup>
import { useUIStateStore } from "@/store/uiState";

const uiState = useUIStateStore();
</script>

<style scoped></style>
