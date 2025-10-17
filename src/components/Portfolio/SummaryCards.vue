<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">總市值</h3>
      <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">${{ totalValue.toLocaleString() }}</p>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">總成本</h3>
      <p class="text-2xl font-bold mt-2 text-[color:var(--color-line3)]">${{ totalCost.toLocaleString() }}</p>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">總報酬率</h3>
      <p class="text-2xl font-bold mt-2"
        :class="[
          totalROI < 0
          ? 'text-[color:var(--color-line3)]'
          : 'text-[color:var(--color-line2)]'
        ]">
        {{ totalROI < 0 ? "" : "+" }}{{ (totalROI*100).toFixed(2) }}%
      </p>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">現金比例</h3>
      <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ (cashRatio * 100).toFixed(2) }}%</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePortfolioStore } from "@/store/portfolio";

const portfolioStore = usePortfolioStore();

const totalValue = computed(() => portfolioStore.totalValue || 0);
const totalCost = computed(() => portfolioStore.totalCost || 0);
const totalROI = computed(() => portfolioStore.overallReturnPercent || 0);
const cashRatio = computed(() => portfolioStore.holdingDetailsData[0].stockValue / portfolioStore.totalValue || 0);
</script>

<style scoped></style>
