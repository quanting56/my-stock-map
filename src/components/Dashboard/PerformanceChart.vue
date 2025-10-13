<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">市值趨勢</h3>
      <div class="text-xs text-[color:var(--color-secondary)]">1 日｜ 5 日｜ 30 日｜ 6 個月｜ 1 年｜ 5 年｜最久</div>
    </div>

    <!-- big sparkline -->
    <div class="h-44 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
      <svg class="w-full h-full">
        <path fill="none" stroke="var(--color-primary)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
      </svg>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-secondary)]">
      <div>當日成交量（示意）<span class="font-medium mt-1">12345</span></div>
      <div class="text-right">最近變動: <span class="font-medium ml-2">0.12%</span></div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
