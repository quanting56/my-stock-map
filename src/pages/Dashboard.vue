<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[color:var(--color-primary)]">🏠 大總覽</h2>
      <button
        @click="isHidden = !isHidden"
        class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] active:ring-2 active:ring-offset-1 active:ring-[var(--color-line1)] transition text-sm cursor-pointer"
      >
        🔧 {{ isHidden ? '顯示總市值' : '隱藏總市值' }}
      </button>
    </div>
  
  
    <!-- 一樓：Summary Cards -->
    <SummaryCards :isTotalValueHidden="isHidden"></SummaryCards>
  
  
    <!-- 二樓：資產分布圖＋市值趨勢圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  
      <!-- 左側：資產分布圖 -->
      <ShareholdingRatioChart :isTotalValueHidden="isHidden"></ShareholdingRatioChart>
  
      <!-- 右側：市值趨勢圖 -->
      <PerformanceChart></PerformanceChart>
  
    </div>
  
  
    <!-- 三樓：持倉明細＋公司市值排名圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  
      <!-- 左側上：持倉明細 -->
      <HoldingDetails :isTotalValueHidden="isHidden"></HoldingDetails>

      <!-- 左側下：觀察名單明細 -->
      <!-- <HoldingDetails :isTotalValueHidden="isHidden"></HoldingDetails> -->

      <!-- 右側：資產分布圖 -->
      <MarketCapitalizationTreemap></MarketCapitalizationTreemap>
    </div>
  
  
    <!-- Bottom: Timeline / Notes -->
    <!-- <TimelineList></TimelineList> -->

    <!-- 測試 components 區域 -->
    <!-- <Test></Test> -->
  </div>
</template>

<script setup lang="ts">
import SummaryCards from "@/components/Dashboard/SummaryCards.vue";
import ShareholdingRatioChart from "@/components/Dashboard/ShareholdingRatioChart.vue";
import PerformanceChart from "@/components/Dashboard/PerformanceChart.vue";
import HoldingDetails from "@/components/Dashboard/HoldingDetails.vue";
import MarketCapitalizationTreemap from "@/components/Dashboard/MarketCapitalizationTreemap.vue";
// import TimelineList from "@/components/Dashboard/TimelineList.vue";
// import Test from "../components/Dashboard/Test.vue";

import { ref } from "vue";

const isHidden = ref(false);
</script>

<style scoped></style>
