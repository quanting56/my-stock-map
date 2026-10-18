<template>
  <nav
    aria-label="主要導覽"
    class="flex flex-col items-start gap-2"
  >
    <button
      v-for="tab in uiStateStore.tabs"
      :key="tab.id"
      type="button"
      :aria-current="tab.id === uiStateStore.activeTab ? 'page' : undefined"
      :aria-label="props.collapsed ? tab.title : undefined"
      :title="props.collapsed ? tab.title : undefined"
      class="flex h-10 cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-3 text-left transition-[width,background-color,color] duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      :class="[
        props.collapsed ? 'w-10' : 'w-full',
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

      <span
        class="shrink-0 whitespace-nowrap transition-opacity duration-150 ease-in-out"
        :class="props.collapsed ? 'opacity-0' : 'opacity-100'"
        :aria-hidden="props.collapsed ? 'true' : undefined"
      >
        {{ tab.title }}
      </span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useUIStateStore } from "@/stores/uiState";

const props = withDefaults(
  defineProps<{
    collapsed?: boolean;
  }>(),
  {
    collapsed: false,
  },
);

const uiStateStore = useUIStateStore();
</script>

<style scoped></style>
