<template>
  <div class="p-6">
    <!-- 頁面標題：公司名與現價 -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold text-[color:var(--color-primary)]">
            {{ ticker }}
          </div>
          <div class="text-sm text-[color:var(--color-secondary)]">
            {{ companyName }}｜臺灣市值第 {{ companyRanking }} 大公司｜{{ isWeightedStocks }}
          </div>
          <div class="ml-3 px-2 py-0.5 rounded-md text-xs font-medium bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
            交易代號
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-4">
          <div class="text-2xl font-bold text-[color:var(--color-primary)]">
            ${{ latestPrice.toLocaleString() }}
          </div>
          <div
            :class="priceChangeClass"
            class="text-sm font-medium"
          >
            {{ priceChangeSign }}{{ priceChangeAbs }} ({{ priceChangePct }}%)
          </div>
          <div class="text-xs text-[color:var(--color-secondary)]">
            成交量 {{ latestVolume.toLocaleString() }}
          </div>
        </div>
      </div>

      <!-- timeframe / 行為按鈕 -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-md p-1">
          <button
            v-for="tf in timeframes"
            :key="tf"
            @click="currentTimeframe = tf"
            :class="[
              'px-3 py-1 rounded-md text-sm transition',
              currentTimeframe === tf ? 'bg-[color:var(--color-primary)] text-white' : ''
            ]"
          >
            {{ tf }}
          </button>
        </div>

        <button class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm">新增觀察</button>
      </div>
    </header>

    <!-- 一樓：價格走勢圖＋資訊摘要 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

      <!-- 左側：價格走勢圖 PriceChartCard.vue -->
      <PriceChartCard
        :current-timeframe="currentTimeframe"
        :last-updated="lastUpdated"
        :indicator-summary="indicatorSummary"
      ></PriceChartCard>

      <!-- 右側：資訊摘要 InformationSummary.vue -->
      <InformationSummary
        :ticker="ticker"
        :fundamental-summary="fundamentalSummary"
        :holding-summary="holdingSummary"
        :holding-summary-p-l="holdingSummaryPL"
        :holding-summary-p-l-class="holdingSummaryPLClass"
        @copy-ticker="copyTicker"
      ></InformationSummary>
    </div>

    <!-- 二樓：持有時間表＋相關新聞／消息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- 左側：持有時間表 HoldingTimelineChart.vue -->
      <HoldingTimelineChart></HoldingTimelineChart>

      <!-- 右側：相關新聞／消息 RelevantNews.vue -->
      <RelevantNews
        :notes="notes"
      ></RelevantNews>
    </div>
  </div>
</template>

<script setup>
import PriceChartCard from "@/components/StockDetail/PriceChartCard.vue";
import InformationSummary from "@/components/StockDetail/InformationSummary.vue";
import HoldingTimelineChart from "@/components/StockDetail/HoldingTimelineChart.vue";
import RelevantNews from "../components/StockDetail/RelevantNews.vue";

import { ref, computed } from "vue";

// 樣式化 / 假資料
const ticker = ref("2330.TW");
const companyName = ref("台積電");
const companyRanking = ref(0 + 1);
const isWeightedStocks = computed(() => {
  return companyRanking.value < 51 ? "權重股" : "";
});
const latestPrice = ref(520);
const latestVolume = ref(123456);
const lastUpdated = ref(new Date().toLocaleString());

const priceChangePct = ref(-1.28);
const priceChangeAbs = ref((latestPrice.value * priceChangePct.value / 100).toFixed(2));
const priceChangeSign = computed(() => (priceChangePct.value >= 0 ? "+" : ""));
const priceChangeClass = computed(() => (priceChangePct.value >= 0 ? "text-red-500" : "text-green-600"));

// timeframes
const timeframes = ["1D", "5D", "1M", "3M", "1Y"];
const currentTimeframe = ref("1M");

// indicators (mock)
const indicatorSummary = ref({
  "MA(20)": 512,
  "MA(50)": 498,
  "RSI": 62,
  "Vol Avg": 98000 / 1000 + "k"
});


// 基本面摘要
const fundamentalSummary = ref({
  peRatio: 22.4,
  pbRatio: 5.6,
  yield: 0.019,
  shareCapital: 259000000000,
  eps: 36.8
});

// 個人持倉快速摘要 (mock)
const holdingSummary = ref({
  shares: 120,
  cost: 450,
});

const holdingSummaryPL = computed(() => {
  const pl = (latestPrice.value - holdingSummary.value.cost) * holdingSummary.value.shares;
  return pl.toFixed(0);
});
const holdingSummaryPLClass = computed(() => (parseFloat(holdingSummaryPL.value) >= 0 ? "text-green-600" : "text-red-500"));

// copy ticker
function copyTicker() {
  navigator.clipboard?.writeText(ticker.value)
    .then(() => alert("已複製代號"))
    .catch(() => alert("複製失敗"));
}



const notes = ref([
  { date: "2025-10-08", text: "法說會預告 - 影響明日盤勢" },
  { date: "2025-09-30", text: "公告除息" }
]);
</script>

<style scoped></style>
