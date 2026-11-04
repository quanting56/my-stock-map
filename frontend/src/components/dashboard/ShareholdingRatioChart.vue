<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow lg:col-span-1">
    <h3 class="mb-2 font-medium text-foreground-muted">持股分布（個股 + ETF）</h3>

    <DonutChart
      :items="chartData"
      chart-aria-label="持股分布圓環圖"
      center-label="持倉"
      :center-value="centerValue"
    ></DonutChart>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { formatAmount } from "@/utils/format/number";
import { usePortfolioStore } from "@/stores/portfolio";

import DonutChart from "@/components/charts/DonutChart.vue";

const props = withDefaults(
  defineProps<{
    isTotalValueHidden?: boolean;
  }>(),
  {
    isTotalValueHidden: false,
  },
);

const portfolioStore = usePortfolioStore();

// 將 store 的資料轉成圖表要的格式
const chartData = computed(() => {
  return portfolioStore.holdingDetailsData
    .filter((holding) => holding.stockValue > 0)
    .map((holding) => ({
      id: holding.id,
      label: holding.name,
      secondaryLabel: holding.id,
      value: holding.stockValue,
      displayValue: props.isTotalValueHidden ? "$ ＊＊＊" : `$${formatAmount(holding.stockValue)}`,
    }))
    .sort((a, b) => b.value - a.value);
});

const totalValue = computed(() => chartData.value.reduce((sum, item) => sum + item.value, 0));

const centerValue = computed(() =>
  props.isTotalValueHidden ? "＊＊＊" : `$${formatAmount(totalValue.value)}`,
);
</script>

<style scoped></style>
