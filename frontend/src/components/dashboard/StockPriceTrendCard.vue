<template>
  <LoadingModal
    :open="isLoading"
    message="股市資料載入中"
  ></LoadingModal>

  <div class="rounded-2xl bg-surface p-4 text-foreground shadow lg:col-span-2">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-medium text-foreground-muted">
        {{ displaySymbol }} 近期趨勢 {{ trendIcon }}
      </h3>

      <div class="flex gap-1 text-xs text-foreground-muted">
        <template
          v-for="(range, index) in RANGE_OPTIONS"
          :key="range.value"
        >
          <button
            type="button"
            class="cursor-pointer transition-colors duration-200 hover:text-brand"
            :class="selectedRange === range.value ? 'font-semibold text-brand' : ''"
            @click="selectedRange = range.value"
          >
            {{ range.label }}
          </button>

          <span
            v-if="index < RANGE_OPTIONS.length - 1"
            aria-hidden="true"
          >
            ｜
          </span>
        </template>
      </div>
    </div>

    <div class="relative h-56 w-full rounded-lg border border-border bg-surface p-3">
      <StockPriceLineChart
        :data="filteredData"
        :chart-aria-label="`${displaySymbol} 近期股價趨勢圖`"
      ></StockPriceLineChart>

      <div
        v-if="loadErrorMessage"
        role="status"
        class="absolute inset-3 flex items-center justify-center bg-surface/90 px-4 text-center text-sm text-danger"
      >
        {{ loadErrorMessage }}
      </div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground-muted">
      <div>
        {{ latestTradingDate ? `${latestTradingDate} ` : "" }}成交量

        <span class="mt-1 ml-1.5 font-medium">
          {{ latestVolume !== null ? `${formatQuantity(latestVolume)} 股` : "—" }}
        </span>
      </div>

      <div class="text-right">
        此區間變動：

        <span
          class="ml-1.5 font-semibold"
          :class="
            changePercent === null
              ? 'text-foreground-muted'
              : changePercent < 0
                ? 'text-loss'
                : 'text-gain'
          "
        >
          {{ changePercent !== null ? formatSignedPercentage(changePercent) : "？" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

import { formatQuantity, formatSignedPercentage } from "@/utils/format/number";
import { fetchStockSeries, type StockBar, type StockRangeQuery } from "@/api/stocksApi";
import { useQueryStockStore } from "@/stores/queryStock";

import StockPriceLineChart from "@/components/charts/StockPriceLineChart.vue";
import LoadingModal from "@/components/common/global/LoadingModal.vue";

const EARLIEST_YEAR = 1990;

const RANGE_OPTIONS = [
  { label: "1 日", value: "1d" },
  { label: "5 日", value: "5d" },
  { label: "30 日", value: "30d" },
  { label: "6 個月", value: "6m" },
  { label: "1 年", value: "1y" },
  { label: "5 年", value: "5y" },
  { label: "10 年", value: "10y" },
  { label: "最久", value: "max" },
] as const;

type PriceRange = (typeof RANGE_OPTIONS)[number]["value"];

const queryStockStore = useQueryStockStore();

const isLoading = ref(false);
const loadErrorMessage = ref("");

const selectedRange = ref<PriceRange>("6m");

// 實際套用在目前圖表上的區間
// 等對應資料準備完成後才更新，避免先切 range 再等待資料造成重複繪製
const activeRange = ref<PriceRange>(selectedRange.value);

const stockData = ref<StockBar[]>([]);

const stockDataCache = new Map<string, StockBar[]>();

let latestRequestId = 0;
let activeDataKey = "";

const stockSymbol = computed(() => queryStockStore.symbol);
const displaySymbol = computed(() => queryStockStore.displaySymbol);

/** 依目前真正生效的 range 過濾已載入資料。 */
const filteredData = computed<StockBar[]>(() => {
  const latestDate = stockData.value.at(-1)?.date;

  if (!latestDate) {
    return [];
  }

  const cutoffDate = getRangeStartDate(activeRange.value, latestDate);

  return stockData.value.filter((datum) => datum.date >= cutoffDate);
});

const changePercent = computed<number | null>(() => {
  const firstDatum = filteredData.value[0];
  const lastDatum = filteredData.value.at(-1);

  if (!firstDatum || !lastDatum || firstDatum.open === 0) {
    return null;
  }

  return (lastDatum.close - firstDatum.open) / firstDatum.open;
});

const trendIcon = computed(() => {
  if (changePercent.value === null) {
    return "";
  }

  return changePercent.value >= 0 ? "📈" : "📉";
});

const latestVolume = computed<number | null>(() => filteredData.value.at(-1)?.volume ?? null);

const formatChartDate = d3.timeFormat("%Y/%m/%d");

const latestTradingDate = computed(() => {
  const latestDate = filteredData.value.at(-1)?.date;

  return latestDate ? formatChartDate(latestDate) : "";
});

/** 根據顯示區間取得起始日期。 */
function getRangeStartDate(range: PriceRange, baseDate: Date, earliestYear = EARLIEST_YEAR): Date {
  switch (range) {
    case "1d":
      return d3.timeDay.offset(baseDate, -1);

    case "5d":
      return d3.timeDay.offset(baseDate, -5);

    case "30d":
      return d3.timeDay.offset(baseDate, -30);

    case "6m":
      return d3.timeMonth.offset(baseDate, -6);

    case "1y":
      return d3.timeYear.offset(baseDate, -1);

    case "5y":
      return d3.timeYear.offset(baseDate, -5);

    case "10y":
      return d3.timeYear.offset(baseDate, -10);

    case "max":
      return new Date(earliestYear, 0, 1);

    default:
      return new Date(earliestYear, 0, 1);
  }
}

/** 將前端顯示區間轉換為股票歷史資料 API 的年月查詢參數。 */
function getRangeQuery(range: PriceRange): StockRangeQuery {
  const now = new Date();
  const startDate = getRangeStartDate(range, now);

  return {
    startYear: startDate.getFullYear(),
    startMonth: startDate.getMonth() + 1,
    endYear: now.getFullYear(),
    endMonth: now.getMonth() + 1,
  };
}

function createCacheKey(symbol: string, params: StockRangeQuery): string {
  return `${symbol}|${params.startYear ?? ""}-${params.startMonth ?? ""}~${
    params.endYear ?? ""
  }-${params.endMonth ?? ""}`;
}

/** 取得指定查詢範圍的股票資料，並處理 cache、競態與錯誤狀態。 */
async function loadStockData(params: StockRangeQuery): Promise<void> {
  const currentRequestId = ++latestRequestId;

  const cacheKey = createCacheKey(stockSymbol.value, params);
  const cachedData = stockDataCache.get(cacheKey);

  if (cachedData) {
    activeDataKey = cacheKey;
    loadErrorMessage.value = "";

    if (stockData.value !== cachedData) {
      stockData.value = cachedData;
    }

    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  loadErrorMessage.value = "";

  try {
    const data = await fetchStockSeries(stockSymbol.value, params);

    if (currentRequestId !== latestRequestId) {
      return;
    }

    if (data.length === 0) {
      stockData.value = [];
      activeDataKey = "";
      loadErrorMessage.value = "目前查無可用的股價資料。";
      return;
    }

    stockDataCache.set(cacheKey, data);

    stockData.value = data;
    activeDataKey = cacheKey;
  } catch (error: unknown) {
    if (currentRequestId !== latestRequestId) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    console.warn(`[StockPriceTrendCard] 無法取得 ${stockSymbol.value} 股價資料：`, errorMessage);

    stockData.value = [];
    activeDataKey = "";
    loadErrorMessage.value = "股價資料讀取失敗，請稍後再試。";
  } finally {
    if (currentRequestId === latestRequestId) {
      isLoading.value = false;
    }
  }
}

/** 判斷目前本地資料是否已涵蓋指定 range。 */
function hasCoverageFor(range: PriceRange): boolean {
  const earliestDate = stockData.value[0]?.date;
  const latestDate = stockData.value.at(-1)?.date;

  if (!earliestDate || !latestDate) {
    return false;
  }

  const cutoffDate = getRangeStartDate(range, latestDate);

  return earliestDate <= cutoffDate;
}

/** 載入目前全站選定股票的資料。 */
async function loadCurrentSymbol(): Promise<void> {
  const range = selectedRange.value;

  await loadStockData(getRangeQuery(range));

  if (selectedRange.value === range) {
    activeRange.value = range;
  }
}

watch(selectedRange, async (range) => {
  if (hasCoverageFor(range)) {
    activeRange.value = range;
    return;
  }

  const params = getRangeQuery(range);

  const cacheKey = createCacheKey(stockSymbol.value, params);

  if (cacheKey !== activeDataKey) {
    await loadStockData(params);
  }

  if (selectedRange.value !== range) {
    return;
  }

  activeRange.value = range;
});

watch(stockSymbol, () => {
  stockData.value = [];
  activeDataKey = "";

  void loadCurrentSymbol();
});

onMounted(() => {
  void loadCurrentSymbol();
});

onBeforeUnmount(() => {
  // 讓仍在進行中的舊 request 回來後直接失效
  latestRequestId += 1;
});
</script>

<style scoped></style>
