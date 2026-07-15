<template>
  <LoadingModal :open="isLoading" message="資料讀取中"></LoadingModal>
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
            ${{ latestPriceText }}
          </div>
          <div
            :class="priceChangeClass"
            class="text-sm font-medium"
          >
            {{ priceChangeSign }}${{ priceChangeAbsText }} / {{ priceChangeSign }}{{ priceChangePctText }}%
          </div>
          <div class="text-xs text-[color:var(--color-secondary)]">
            {{ lastUpdated.toLocaleString("zh-TW", { month: "2-digit", day: "numeric" }) }}
            成交量 {{ latestVolumeText }}
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
        :holding-summary-p-l-ratio="holdingSummaryPLRatio"
        :holding-summary-p-l-class="holdingSummaryPLClass"
        @copy-ticker="copyTicker"
        @open-ptt-query-stock="openPttQueryStock"
        @open-dcard-query-stock="openDcardQueryStock"
      ></InformationSummary>
    </div>

    <!-- 二樓：持有時間表＋相關新聞／消息 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- 左側：持有時間表 HoldingTimelineChart.vue -->
      <HoldingTimelineChart></HoldingTimelineChart>

      <!-- 右側：相關新聞／消息 RelevantNews.vue -->
      <RelevantNews></RelevantNews>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useQueryStockStore } from "@/store/queryStock";
import { fetchSymbolProfile, fetchCompanyRank, fetchStockSeries, fetchFundamentals } from "@/api/stocksApi";

import PriceChartCard from "@/components/StockDetail/PriceChartCard.vue";
import InformationSummary from "@/components/StockDetail/InformationSummary.vue";
import HoldingTimelineChart from "@/components/StockDetail/HoldingTimelineChart.vue";
import RelevantNews from "@/components/StockDetail/RelevantNews.vue";
import LoadingModal from "@/components/Common/LoadingModal.vue";

type Timeframe = "7D" | "1M" | "3M" | "1Y" | "3Y";

interface RecentRangeParams {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

interface SymbolProfile {
  name: string;
  industry: string | null;
}

interface CompanyRank {
  rank: number | null;
}

interface StockSeriesRow {
  close: number;
  volume: number;
  date: Date | string;
}

interface FundamentalSummary {
  peRatio: number | null;
  pbRatio: number | null;
  yield: number | null;
  shareCapital: number | null;
  eps: number | null;
}

interface Fundamentals {
  peRatio: number | null;
  pbRatio: number | null;
  yield: number | null;
  shareCapital: number | null;
  eps: number | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatFixed(value: number | null, digits = 2): string {
  return isFiniteNumber(value) ? value.toFixed(digits) : "—";
}

function formatAbsoluteFixed(value: number | null, digits = 2): string {
  return isFiniteNumber(value)
    ? Math.abs(value).toFixed(digits)
    : "—";
}

function parseApiDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

// Pinia
const queryStock = useQueryStockStore();

const isLoading = ref(false);


// === <header> 資訊 ===
// 樣式化（部分為寫死的假資料）
const ticker = computed(() => queryStock.displaySymbol);
// const companyName = ref("台積電");
const companyName = ref("—");
const companyRankingNum = ref<number | null>(null);
const companyRanking = computed(() => {
  return isFiniteNumber(companyRankingNum.value)
    ? `｜臺灣市值第 ${companyRankingNum.value} 大公司`
    : "";
});
const isWeightedStocks = computed(() => {
  return isFiniteNumber(companyRankingNum.value) && companyRankingNum.value < 11
    ? "｜前 10 大權重股"
    : "";
});
// const industryCategory = ref("半導體製造業");
const industryCategory = ref("—");

const latestPrice = ref<number | null>(null);
const latestVolume = ref<number | null>(null);
const lastUpdated = ref(new Date());

const priceChangePct = ref<number | null>(null);
const priceChangeAbs = ref<number | null>(null);

const latestPriceText = computed(() => formatFixed(latestPrice.value, 2));

const latestVolumeText = computed(() => {
  return isFiniteNumber(latestVolume.value)
    ? latestVolume.value.toLocaleString("zh-TW")
    : "—";
});

const priceChangeAbsText = computed(() => formatAbsoluteFixed(priceChangeAbs.value, 2));
const priceChangePctText = computed(() => formatAbsoluteFixed(priceChangePct.value, 2));

const priceChangeSign = computed(() => {
  if (!isFiniteNumber(priceChangePct.value)) return "";
  return priceChangePct.value >= 0 ? "+" : "-";
});
const priceChangeClass = computed(() => {
  if (!isFiniteNumber(priceChangePct.value)) return "text-red-500";
  return priceChangePct.value >= 0 ? "text-red-500" : "text-green-600";
});

// timeframes
const timeframes = ["7D", "1M", "3M", "1Y", "3Y"] as const;
const currentTimeframe = ref<Timeframe>("3M");

async function refreshHeadline(): Promise<void> {
  // 先清空上一支股票的資料，避免 API 尚未回來時顯示舊股票資料
  companyName.value = "—";
  industryCategory.value = "—";
  companyRankingNum.value = null;

  latestPrice.value = null;
  latestVolume.value = null;
  priceChangeAbs.value = null;
  priceChangePct.value = null;

  try {
    // === 查股票基本資料（公司名稱、產業） ===
    const prof = await fetchSymbolProfile(queryStock.symbol) as SymbolProfile | null;

    if (prof) {
      companyName.value = prof.name;
      industryCategory.value = prof.industry ?? "—";
    }

    // === 查股票市值排名 ===
    const rankInfo = await fetchCompanyRank(queryStock.symbol) as CompanyRank | null;

    if (rankInfo && isFiniteNumber(rankInfo.rank)) {
      companyRankingNum.value = rankInfo.rank;
    }

    // === 查最近三個月股票資料 ===
    const rows = await fetchStockSeries(
      queryStock.symbol,
      makeRecentRangeParams(3)
    ) as StockSeriesRow[];

    const last = rows[rows.length - 1];
    if (!last) return;  // 即使 rows 型別是陣列，也仍然可能是空陣列

    const prev = rows[rows.length - 2];

    // 最後一日收盤價
    latestPrice.value = last.close;

    // 最新一日成交量
    latestVolume.value = Math.round(last.volume);

    // 最後更新日期
    const parsedLastUpdated = parseApiDate(last.date);

    if (parsedLastUpdated) {
      lastUpdated.value = parsedLastUpdated;
    }

    // 有前一個交易日，且前一日收盤價不是 0，才計算漲跌
    if (prev && prev.close !== 0) {
      const diff = last.close - prev.close;

      priceChangeAbs.value = diff;
      priceChangePct.value = Number(((diff / prev.close) * 100).toFixed(2));
    }
  } catch (err) {
    console.warn("refreshHeadline failed:", err);
  }
}

// 為 <header> 做一個「最近 N 個月」的參數產生器
function makeRecentRangeParams(monthsBack = 3): RecentRangeParams {
  const now = new Date();
  const endYear = now.getFullYear();
  const endMonth = now.getMonth() + 1;

  const start = new Date(now);
  start.setMonth(start.getMonth() - monthsBack);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;

  return { startYear, startMonth, endYear, endMonth };
}

// 此處不在這裡觸發，改由最後由 refreshAll() 統一觸發
// watch(
//   () => queryStock.symbol,
//   () => { refreshHeadline(); },
//   { immediate: true }
// );
// === <header> 資訊完 ===





// 基本面摘要
const fundamentalSummary = ref<FundamentalSummary>({
  peRatio: null,         // 本益比
  pbRatio: null,         // 股價淨值比
  yield: null,           // 殖利率
  shareCapital: null,    // 股本
  eps: null
});

async function refreshFundamentalSummary(): Promise<void> {
  try {
    const f = await fetchFundamentals(queryStock.symbol) as Fundamentals | null;

    if (!f) {
      fundamentalSummary.value = {
        peRatio: null,
        pbRatio: null,
        yield: null,
        shareCapital: null,
        eps: null,
      };

      return;
    }

    fundamentalSummary.value = {
      peRatio: isFiniteNumber(f.peRatio) ? f.peRatio : null,
      pbRatio: isFiniteNumber(f.pbRatio) ? f.pbRatio : null,
      yield: isFiniteNumber(f.yield) ? f.yield : null,
      shareCapital: isFiniteNumber(f.shareCapital)
        ? f.shareCapital
        : null,
      eps: isFiniteNumber(f.eps) ? f.eps : null
    };
  } catch (err) {
    console.warn("refreshFundamentalSummary failed:", err);

    fundamentalSummary.value = {
      peRatio: null,
      pbRatio: null,
      yield: null,
      shareCapital: null,
      eps: null,
    };
  }
}

// 此處不在這裡觸發，改由最後由 refreshAll() 統一觸發
// watch(
//   () => queryStock.symbol,
//   () => { refreshFundamentalSummary(); },
//   { immediate: true }
// );



// 個人持倉快速摘要 (mock)
const holdingSummary = ref({
  shares: 120,
  cost: 450,
});


const holdingSummaryPL = computed(() => {
  if (!isFiniteNumber(latestPrice.value)) return 0;
  return (latestPrice.value - holdingSummary.value.cost) * holdingSummary.value.shares;
});
const holdingSummaryPLRatio = computed(() => {
  if (!isFiniteNumber(latestPrice.value) || holdingSummary.value.cost === 0) { return 0; }
  return (latestPrice.value - holdingSummary.value.cost) / holdingSummary.value.cost;
});
const holdingSummaryPLClass = computed(() => {
  return holdingSummaryPL.value >= 0 ? "text-red-500" : "text-green-600";
});

// copy ticker
function copyTicker() {
  navigator.clipboard?.writeText(ticker.value)
    .then(() => alert("已複製代號"))
    .catch(() => alert("複製失敗"));
};

// 查看 ["PTT", "Dcard"] 討論這家公司的文章
// 外部站台搜尋
function makeSearchKeyword() {  // 以公司名優先，其次用四碼代號
  const name = companyName.value && companyName.value !== "—" ? companyName.value : "";
  const code = (queryStock.symbol || "").replace(/\D/g, "");  // 例如 "2330"
  return [name, code].filter(Boolean).join(" ");
};

function openPttQueryStock() {
  const q = encodeURIComponent(makeSearchKeyword());
  // 方案一（較穩，不會卡未滿18）：用 Google 限站搜尋 PTT
  const url = `https://www.google.com/search?q=site:ptt.cc%20${q}`;
  // 方案二（想直接看 PTT Web 版可改用這行）：const url = `https://www.pttweb.cc/search?q=${q}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

function openDcardQueryStock() {
  const q = encodeURIComponent(makeSearchKeyword());
  const url = `https://www.dcard.tw/search?query=${q}`;
  window.open(url, "_blank", "noopener,noreferrer");
};



// 頁面級 Loading 狀態由此統一觸發
async function refreshAll() {
  isLoading.value = true;
  try {
    await Promise.all([
      refreshHeadline(),
      refreshFundamentalSummary()
    ]);
  } finally {
    isLoading.value = false;
  };
};
watch(() => queryStock.symbol, () => { refreshAll(); }, { immediate: true });
</script>

<style scoped></style>
