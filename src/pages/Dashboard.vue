<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[color:var(--color-primary)]">🏠 大總覽</h2>
      <button
        class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] transition text-sm"
      >
        🔧 隱藏總市值
      </button>
    </div>
  
  
    <!-- 一樓：Summary Cards -->
    <SummaryCards></SummaryCards>
  
  
    <!-- 二樓：資產分布圖＋市值趨勢圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  
      <!-- 左側：資產分布圖 -->
      <ShareholdingRatioChart></ShareholdingRatioChart>
  
      <!-- 右側：市值趨勢圖 -->
      <PerformanceChart></PerformanceChart>
  
    </div>
  
  
    <!-- 三樓：持倉明細＋公司市值排名圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
  
      <!-- 左側：持倉明細 -->
      <HoldingDetails></HoldingDetails>
  
      <!-- 右側：資產分布圖 -->
      <MarketCapitalizationShareChart></MarketCapitalizationShareChart>
    </div>
  
  
    <!-- Bottom: Timeline / Notes -->
    <TimelineList></TimelineList>
  </div>
</template>

<script setup>
import SummaryCards from "@/components/Dashboard/SummaryCards.vue";
import ShareholdingRatioChart from "@/components/Dashboard/ShareholdingRatioChart.vue";
import PerformanceChart from "@/components/Dashboard/PerformanceChart.vue";
import HoldingDetails from "@/components/Dashboard/HoldingDetails.vue";
import MarketCapitalizationShareChart from "@/components/Dashboard/MarketCapitalizationShareChart.vue";
import TimelineList from "@/components/Dashboard/TimelineList.vue";
</script>

<style scoped></style>
