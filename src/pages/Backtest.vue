<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題：回測工具說明 -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">🔍 回測模組</h1>
        <p class="text-sm text-[color:var(--color-secondary)] mt-1">
          用過去推測未來，由已知求未知。
        </p>
      </div>
    </div>


    <div>
      <h1 class="text-2xl mt-8 font-semibold">多檔比較</h1>
      <p class="text-sm text-[color:var(--color-secondary)] mt-1">
        過去的某個時間點 All In 到不同股票裡，到現在的投資報酬率會相差多少呢？
      </p>
    </div>

    <!-- 一樓：滾動報酬率比較圖 -->
    <RollingReturnTest></RollingReturnTest>


    <div>
      <h1 class="text-2xl mt-8 font-semibold">單檔比較</h1>
      <p class="text-sm text-[color:var(--color-secondary)] mt-1">
        用每日收盤價模擬不同投資策略在過去市場的長期績效表現，以檢驗穩定性與報酬潛力。
      </p>
    </div>

    <!-- 二樓：定期定額/單筆投入回測圖 -->
    <SingleAssetBacktest></SingleAssetBacktest>
  </div>
</template>

<script setup>
import RollingReturnTest from "@/components/Backtest/RollingReturnTest.vue";
import SingleAssetBacktest from "@/components/Backtest/SingleAssetBacktest.vue";
</script>

<style scoped></style>
