<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-2xl bg-surface p-4 text-center text-foreground shadow">
      <h3 class="text-sm text-foreground-muted">持股總市值</h3>
      <p class="mt-1 text-2xl font-bold text-brand">
        {{ isTotalValueHidden ? "＊＊＊＊＊＊" : formatAmount(stockMarketValue) }}
      </p>
      <div class="mt-1 text-xs text-foreground-muted">持倉：{{ formatPercentage(stockRatio) }}</div>
    </div>

    <div class="rounded-2xl bg-surface p-4 text-center text-foreground shadow">
      <h3 class="text-sm text-foreground-muted">今日損益</h3>
      <p class="mt-1 text-2xl font-bold text-gain">+2.4%</p>
      <div class="mt-1 text-xs text-foreground-muted">
        {{ isTotalValueHidden ? "+ ＊＊＊" : "+$219.222" }}
      </div>
    </div>

    <div class="rounded-2xl bg-surface p-4 text-center text-foreground shadow">
      <h3 class="text-sm text-foreground-muted">近 7 日漲跌</h3>
      <p class="mt-1 text-2xl font-bold text-loss">-1.2%</p>
      <div class="mt-1 text-xs text-foreground-muted">觀察趨勢</div>
    </div>

    <div class="rounded-2xl bg-surface p-4 text-center text-foreground shadow">
      <h3 class="text-sm text-foreground-muted">現金部位</h3>
      <p class="mt-1 text-2xl font-bold text-brand">{{ formatPercentage(cashRatio) }}</p>
      <div class="mt-1 text-xs text-foreground-muted">
        尚餘 {{ isTotalValueHidden ? "＊＊＊" : formatAmount(cashValue) }} 元
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { formatAmount, formatPercentage } from "@/utils/format/number";
import { usePortfolioStore } from "@/stores/portfolio";

withDefaults(
  defineProps<{
    isTotalValueHidden?: boolean;
  }>(),
  {
    isTotalValueHidden: false,
  },
);

const portfolioStore = usePortfolioStore();

const stockMarketValue = computed(() => portfolioStore.totalValueExCash);

const cashHolding = computed(() =>
  portfolioStore.holdingDetailsData.find((holding) => holding.id === "CASH"),
);

const cashValue = computed(() => cashHolding.value?.stockValue ?? 0);

const cashRatio = computed(() =>
  portfolioStore.totalValue ? cashValue.value / portfolioStore.totalValue : 0,
);
const stockRatio = computed(() =>
  portfolioStore.totalValue ? portfolioStore.totalValueExCash / portfolioStore.totalValue : 0,
);
</script>

<style scoped></style>
