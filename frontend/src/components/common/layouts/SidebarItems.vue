<template>
  <nav
    aria-label="主要導覽"
    class="flex flex-col gap-2"
  >
    <button
      v-for="tab in uiStateStore.tabs"
      :key="tab.id"
      type="button"
      :aria-current="tab.id === uiStateStore.activeTab ? 'page' : undefined"
      class="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      :class="[
        tab.id === uiStateStore.activeTab
          ? 'bg-brand-soft font-semibold text-brand-soft-foreground'
          : 'text-foreground hover:bg-surface-hover',
      ]"
      @click="uiStateStore.setTab(tab.id)"
    >
      <span
        class="shrink-0"
        aria-hidden="true"
      >
        {{ tab.icon }}
      </span>

      <span>
        {{ tab.title }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useUIStateStore } from "@/stores/uiState";

const uiStateStore = useUIStateStore();
</script>

<style scoped></style>
