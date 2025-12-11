<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">持股總市值</h3>
      <p class="text-2xl font-bold mt-1 text-[color:var(--color-primary)]">
        {{ isTotalValueHidden ? "＊＊＊＊＊＊" : "$" + totalValueExCash.toLocaleString() }}
      </p>
      <div class="text-xs text-[color:var(--color-secondary)] mt-1">持倉：{{ ((1 - cashRatio) * 100).toFixed(2) }}%</div>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">今日損益</h3>
      <p class="text-2xl font-bold mt-1 text-[color:var(--color-line2)]">+2.4%</p>
      <div class="text-xs text-[color:var(--color-secondary)] mt-1">
        {{ isTotalValueHidden ? "+ ＊＊＊" : "+$219.222" }}
      </div>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">近 7 日漲跌</h3>
      <p class="text-2xl font-bold mt-1 text-[color:var(--color-line3)]">-1.2%</p>
      <div class="text-xs text-[color:var(--color-secondary)] mt-1">觀察趨勢</div>
    </div>
    <div class="card-theme rounded-2xl shadow p-4 text-center">
      <h3 class="text-sm text-[color:var(--color-secondary)]">現金部位</h3>
      <p class="text-2xl font-bold mt-1 text-[color:var(--color-primary)]">{{ (cashRatio * 100).toFixed(2) }}%</p>
      <div class="text-xs text-[color:var(--color-secondary)] mt-1">
        尚餘 {{ isTotalValueHidden ? "＊＊＊" : "$" + cashQuantity.toLocaleString() }} 元
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePortfolioStore } from "../../store/portfolio";

defineProps({
  isTotalValueHidden: {
    type: Boolean,
    default: false
  }
});

const portfolioStore = usePortfolioStore();

const totalValueExCash = computed(() => portfolioStore.totalValueExCash || 0);
const cashQuantity = computed(() => portfolioStore.holdingDetailsData[0].stockValue || 0);
const cashRatio = computed(() => portfolioStore.holdingDetailsData[0].stockValue / portfolioStore.totalValue || 0);
</script>

<style scoped></style>
