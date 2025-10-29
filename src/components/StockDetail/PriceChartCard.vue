<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="font-medium text-[color:var(--color-secondary)]">價格走勢（{{ props.currentTimeframe }}）</div>
      <div class="text-xs text-[color:var(--color-secondary)]">最後更新：{{ props.lastUpdated }}</div>
    </div>

    <!-- 這裡放你之後要換成 Chart 的容器 -->
    <div class="h-72 md:h-96 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
      [Price chart placeholder — use D3 / Chart.js here]
    </div>

    <!-- 下方：技術指標小卡 -->
    <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="(v, k) in props.indicatorSummary" :key="k" class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-center">
        <div class="text-xs text-[color:var(--color-secondary)]">{{ k }}</div>
        <div class="text-lg font-semibold mt-1">{{ v }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  currentTimeframe: String,
  lastUpdated: String,
  indicatorSummary: Object
});
</script>

<style scoped></style>
