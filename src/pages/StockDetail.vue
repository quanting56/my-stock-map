<template>
  <div class="p-6">
    <!-- 頁面標題：公司名與現價 -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-end gap-3">
          <div class="text-3xl font-bold text-[color:var(--color-primary)]">
            {{ companyName }}
          </div>
          <div class="mr-3 px-2 py-0.5 rounded-md text-xs font-medium bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
            {{ ticker }}
          </div>
          <div class="text-sm text-[color:var(--color-secondary)]">
            {{ industryCategory }}{{ companyRanking }}{{ isWeightedStocks }}
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-4">
          <div
            :class="priceChangeClass"
            class="text-2xl font-bold"
          >
            ${{ Number(latestPrice).toFixed(2) }}
          </div>
          <div
            :class="priceChangeClass"
            class="text-sm font-medium"
          >
            {{ priceChangeSign }}${{ Math.abs(Number(priceChangeAbs)).toFixed(2) }} / {{ priceChangeSign }}{{ Math.abs(Number(priceChangePct)).toFixed(2) }}%
          </div>
          <div class="text-xs text-[color:var(--color-secondary)]">
            {{ lastUpdated.toLocaleString("zh-TW", { month: "2-digit", day: "numeric" }) }}
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
              'px-3 py-1 rounded-md text-sm transition cursor-pointer',
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

import { ref, computed, watch } from "vue";
import { useQueryStockStore } from "@/store/queryStock";
import { fetchSymbolProfile, fetchCompanyRank, fetchStockSeries } from "@/api/stocksApi";

// Pinia
const queryStock = useQueryStockStore();


// === <header> 資訊 ===
// 樣式化（部分為寫死的假資料）
const ticker = computed(() => queryStock.displaySymbol);
// const companyName = ref("台積電");
const companyName = ref("—");
const companyRankingNum = ref(null);
const companyRanking = computed(() => {
  return Number.isFinite(companyRankingNum.value)
    ? `｜臺灣市值第 ${companyRankingNum.value} 大公司`
    : "";
});
const isWeightedStocks = computed(() => {
  return Number.isFinite(companyRankingNum.value) && companyRankingNum.value < 11
    ? "｜前 10 大權重股"
    : "";
});
// const industryCategory = ref("半導體製造業");
const industryCategory = ref("—");

const latestPrice = ref("-");
const latestVolume = ref("-");
const lastUpdated = ref(new Date());

const priceChangePct = ref("-");
const priceChangeAbs = ref("-");
const priceChangeSign = computed(() => {
  if (!Number.isFinite(priceChangePct.value)) return "";
  return priceChangePct.value >= 0 ? "+" : "-";
});
const priceChangeClass = computed(() => {
  if (!Number.isFinite(priceChangePct.value)) return "text-red-500";
  return priceChangePct.value >= 0 ? "text-red-500" : "text-green-600";
});

// timeframes
const timeframes = ["7D", "1M", "3M", "1Y", "3Y"];
const currentTimeframe = ref("3M");

async function refreshHeadline() {
  try {
    // === 查股票基本資料（公司名稱、產業） ===
    const prof = await fetchSymbolProfile(queryStock.symbol);
    if (prof) {
      companyName.value = prof.name || "—";
      industryCategory.value = prof.industry || "—";
    } else {
      companyName.value = "—";
      industryCategory.value = "—";
    };

    // === 查股票市值排名 ===
    companyRankingNum.value = null;
    const rankInfo = await fetchCompanyRank(queryStock.symbol);
    if (rankInfo?.rank) companyRankingNum.value = rankInfo.rank;

    // === 處理股票股價資訊 ===
    const rows = await fetchStockSeries(queryStock.symbol);
    if (rows && rows.length) {
      const last = rows.at(-1);
      const prev = rows.at(-2);
      // 最後一日收盤價
      if (Number.isFinite(last.close)) {
        latestPrice.value = last.close;
      };
      // 最新一日成交量
      if (Number.isFinite(last?.volume)) {
        latestVolume.value = Math.round(last.volume);
      };
      // 同步「最後更新」
      if (last?.date instanceof Date && !Number.isNaN(+last.date)) {
        lastUpdated.value = last.date;
      };
      // 計算與前一日的漲跌（有 prev 才算）
      if (Number.isFinite(prev?.close) && Number.isFinite(last?.close) && prev.close !== 0) {
        const diff = last.close - prev.close;
        priceChangeAbs.value = Number(diff);
        priceChangePct.value = Number(((diff / prev.close) * 100).toFixed(2));
      };
    };
  } catch (err) {
    console.warn("refreshHeadline failed:", err);
    // 失敗時維持原值，不強制覆寫
  };
};

watch(
  () => queryStock.symbol,
  () => { refreshHeadline(); },
  { immediate: true }
);
// === <header> 資訊完 ===





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
