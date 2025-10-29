<template>
  <div class="card-theme rounded-2xl shadow p-4 space-y-4">
    <div>
      <h3 class="font-medium text-[color:var(--color-primary)]">基本面摘要</h3>
      <ul class="text-sm space-y-1 text-[color:var(--color-text)] mt-2">
        <li>本益比（PE）：<span class="font-medium text-[color:var(--color-primary)]">{{ props.fundamentalSummary.peRatio }}</span></li>
        <li>股價淨值比（PB）：<span class="font-medium text-[color:var(--color-primary)]">{{ props.fundamentalSummary.pbRatio }}</span></li>
        <li>殖利率：<span class="font-medium text-[color:var(--color-primary)]">{{ (props.fundamentalSummary.yield * 100).toFixed(1) }}%</span></li>
        <li>股本：<span class="font-medium text-[color:var(--color-primary)]">{{ (props.fundamentalSummary.shareCapital / 10**8).toLocaleString() }} 億</span></li>
        <li>EPS（近四季）：<span class="font-medium text-[color:var(--color-primary)]">{{ props.fundamentalSummary.eps.toLocaleString() }}</span></li>
      </ul>
    </div>

    <div class="border-t border-[color:var(--color-border)] pt-3">
      <h3 class="font-medium text-[color:var(--color-primary)]">個人持倉快速摘要</h3>
      <ul class="text-sm space-y-1 text-[color:var(--color-secondary)] mt-2">
        <li>成本： <span class="font-medium">${{ props.holdingSummary.cost.toLocaleString() }}</span></li>
        <li>持股數： <span class="font-medium">{{ props.holdingSummary.shares }}</span></li>
        <li>損益： <span :class="props.holdingSummaryPLClass" class="font-medium">${{ props.holdingSummaryPL }} (-6.21%)</span></li>
      </ul>
    </div>

    <div class="border-t border-[color:var(--color-border)] pt-3">
      <h4 class="font-medium mb-2">更多</h4>
      <div class="space-y-2.5">
        <button
          @click="$emit('copy-ticker')"
          class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm cursor-pointer">
          複製代號 {{ props.ticker }}
        </button>
        <button class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm cursor-pointer">
          查看 PTT 討論這家公司的文章
        </button>
        <button class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm cursor-pointer">
          查看 Dcard 討論這家公司的文章
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  ticker: String,
  fundamentalSummary: Object,
  holdingSummary: Object,
  holdingSummaryPL: [String, Number],
  holdingSummaryPLClass: String
});

defineEmits(['copy-ticker']);
</script>

<style scoped></style>
