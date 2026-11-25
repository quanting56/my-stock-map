<template>
  <div class="space-y-6 p-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-brand">🏠 大總覽</h2>
      <button
        type="button"
        class="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm transition hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:ring-2 active:ring-focus active:ring-offset-1 active:ring-offset-background"
        @click="isTotalValueHidden = !isTotalValueHidden"
      >
        🔧 {{ isTotalValueHidden ? "顯示總市值" : "隱藏總市值" }}
      </button>
    </div>

    <!-- 一樓：Summary Cards -->
    <SummaryCards :is-total-value-hidden="isTotalValueHidden"></SummaryCards>

    <!-- 二樓：資產分布圖＋市值趨勢圖 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 左側：資產分布圖 -->
      <HoldingAllocationCard :is-total-value-hidden="isTotalValueHidden"></HoldingAllocationCard>

      <!-- 右側：市值趨勢圖 -->
      <StockPriceTrendCard></StockPriceTrendCard>
    </div>

    <!-- 三樓：持倉明細＋公司市值排名圖 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- 左側：持倉明細 -->
      <HoldingDetails :is-total-value-hidden="isTotalValueHidden"></HoldingDetails>

      <!-- 右側：大盤市值佔比圖 -->
      <MarketCapitalizationCard></MarketCapitalizationCard>
    </div>

    <!-- Bottom: Timeline / Notes -->
    <!-- <TimelineList></TimelineList> -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import HoldingAllocationCard from "@/components/dashboard/HoldingAllocationCard.vue";
import HoldingDetails from "@/components/dashboard/HoldingDetails.vue";
import MarketCapitalizationCard from "@/components/dashboard/MarketCapitalizationCard.vue";
import StockPriceTrendCard from "@/components/dashboard/StockPriceTrendCard.vue";
import SummaryCards from "@/components/dashboard/SummaryCards.vue";
// import TimelineList from "@/components/dashboard/TimelineList.vue";

const isTotalValueHidden = ref(false);
</script>

<style scoped></style>
