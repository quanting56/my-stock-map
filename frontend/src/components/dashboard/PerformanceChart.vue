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

    <div
      ref="chartContainerRef"
      class="relative h-44 w-full rounded-lg border border-border bg-surface p-3"
    >
      <svg
        ref="svgRef"
        class="h-full w-full"
      ></svg>

      <div
        v-if="loadErrorMessage"
        role="status"
        class="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-danger"
      >
        {{ loadErrorMessage }}
      </div>

      <div
        ref="tooltipRef"
        class="pointer-events-none absolute rounded border border-border bg-surface px-2 py-1 text-xs text-foreground opacity-0 shadow transition-opacity duration-200"
      ></div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground-muted">
      <div>
        {{ latestTradingDate }} 成交量

        <span class="mt-1 ml-1.5 font-medium">
          {{ latestVolume !== null ? formatQuantity(latestVolume) : "？" }} 股
        </span>
      </div>

      <div class="text-right">
        此區間變動：
        <span
          class="ml-1.5 font-semibold"
          :class="changePercent !== null && changePercent < 0 ? 'text-loss' : 'text-gain'"
        >
          {{ changePercent !== null ? formatSignedPercentage(changePercent) : "？" }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

import { formatQuantity, formatSignedPercentage } from "@/utils/format/number";
import { fetchStockSeries, type StockBar, type StockRangeQuery } from "@/api/stocksApi";
import { useQueryStockStore } from "@/stores/queryStock";

import LoadingModal from "@/components/common/global/LoadingModal.vue";

const EARLIEST_YEAR = 1990;
const LINE_TRANSITION_DURATION = 1000;

const TOOLTIP_WIDTH = 160;
const TOOLTIP_HEIGHT = 76;
const TOOLTIP_OFFSET = 12;

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

const chartContainerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

const selectedRange = ref<PriceRange>("6m");

// 實際套用在目前圖表上的區間
// 等對應資料準備完成後才更新，避免先切 range 再等待資料造成重複繪製
const activeRange = ref<PriceRange>(selectedRange.value);

const stockData = ref<StockBar[]>([]);

const stockDataCache = new Map<string, StockBar[]>();

let latestRequestId = 0;
let activeDataKey = "";
let resizeObserver: ResizeObserver | null = null;

const chartResizeTick = ref(0);

const stockSymbol = computed(() => queryStockStore.symbol);
const displaySymbol = computed(() => queryStockStore.displaySymbol);

/** 依目前真正生效的 range 過濾已載入資料。 */
const filteredData = computed<StockBar[]>(() => {
  if (stockData.value.length === 0) {
    return [];
  }

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

const latestTradingDate = computed(() => {
  const latestDate = filteredData.value.at(-1)?.date;

  return latestDate ? formatChartDate(latestDate) : "";
});

const formatChartDate = d3.timeFormat("%Y/%m/%d");

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
  // 每次資料需求都先產生新 request id
  // 即使這次命中 cache，也能讓較早仍在進行中的 request 失效
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
    loadErrorMessage.value = "";
  } catch (error: unknown) {
    if (currentRequestId !== latestRequestId) {
      return;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    console.warn(`[PerformanceChart] 無法取得 ${stockSymbol.value} 股價資料：`, errorMessage);

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

/** 清除目前 SVG 與 tooltip。 */
function clearChart(): void {
  if (svgRef.value) {
    d3.select(svgRef.value).selectAll("*").interrupt().remove();
  }

  if (tooltipRef.value) {
    d3.select(tooltipRef.value).interrupt().style("opacity", 0);
  }
}

/** 繪製股票價格趨勢圖。 */
function renderChart(data: StockBar[]): void {
  const containerElement = chartContainerRef.value;
  const svgElement = svgRef.value;
  const tooltipElement = tooltipRef.value;

  if (!containerElement || !svgElement || !tooltipElement || data.length < 2) {
    return;
  }

  const width = containerElement.clientWidth;
  const height = containerElement.clientHeight;

  if (width <= 0 || height <= 0) {
    return;
  }

  const firstDatum = data[0];
  const lastDatum = data.at(-1);

  if (!firstDatum || !lastDatum) {
    return;
  }

  const minPrice = d3.min(data, (datum) => datum.low);
  const maxPrice = d3.max(data, (datum) => datum.high);

  if (minPrice === undefined || maxPrice === undefined) {
    return;
  }

  const margin = {
    top: 10,
    right: 40,
    bottom: 40,
    left: 40,
  };

  const svg = d3.select<SVGSVGElement, unknown>(svgElement);

  svg.selectAll("*").interrupt().remove();

  const xScale = d3
    .scaleTime()
    .domain([firstDatum.date, lastDatum.date])
    .range([margin.left, width - margin.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([minPrice, maxPrice])
    .range([height - margin.bottom, margin.top])
    .nice();

  const lineGenerator = d3
    .line<StockBar>()
    .x((datum) => xScale(datum.date))
    .y((datum) => yScale(datum.close))
    .curve(d3.curveMonotoneX);

  const lineColor = lastDatum.close >= firstDatum.open ? "var(--color-gain)" : "var(--color-loss)";

  const path = svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", lineColor)
    .attr("stroke-width", 2)
    .attr("d", lineGenerator);

  const pathElement = path.node();

  if (pathElement) {
    const totalLength = pathElement.getTotalLength();

    path
      .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(LINE_TRANSITION_DURATION)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);
  }

  const xAxis = d3.axisBottom(xScale).ticks(5, "%Y/%m/%d");
  const yAxis = d3.axisLeft(yScale).ticks(5);

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .attr("color", "var(--color-foreground-muted)");

  svg
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(yAxis)
    .attr("color", "var(--color-foreground-muted)");

  const tooltip = d3.select(tooltipElement);

  const dateBisector = d3.bisector<StockBar, Date>((datum) => datum.date);

  const crosshair = svg
    .append("line")
    .attr("stroke", "var(--color-border-strong)")
    .attr("stroke-width", 1)
    .attr("y1", margin.top)
    .attr("y2", height - margin.bottom)
    .style("opacity", 0);

  const dot = svg.append("circle").attr("r", 4).attr("fill", lineColor).style("opacity", 0);

  svg
    .append("rect")
    .attr("fill", "transparent")
    .attr("width", width)
    .attr("height", height)
    .on("mousemove", (event: MouseEvent) => {
      const [pointerX] = d3.pointer(event, svgElement);
      const pointerDate = xScale.invert(pointerX);

      const insertionIndex = dateBisector.left(data, pointerDate);
      const datumIndex = Math.min(Math.max(insertionIndex, 0), data.length - 1);

      const datum = data[datumIndex];

      if (!datum) {
        return;
      }

      const datumX = xScale(datum.date);
      const datumY = yScale(datum.close);

      crosshair
        .interrupt()
        .transition()
        .duration(80)
        .attr("x1", datumX)
        .attr("x2", datumX)
        .style("opacity", 0.6);

      dot
        .interrupt()
        .transition()
        .duration(80)
        .attr("cx", datumX)
        .attr("cy", datumY)
        .style("opacity", 1);

      let tooltipX = datumX + TOOLTIP_OFFSET;
      let tooltipY = datumY - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;

      if (tooltipX + TOOLTIP_WIDTH > width) {
        tooltipX = datumX - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
      }

      if (tooltipY < 0) {
        tooltipY = datumY + TOOLTIP_OFFSET;
      }

      const previousClose = datumIndex > 0 ? data[datumIndex - 1]?.close : null;

      tooltip
        .interrupt()
        .html(
          `
            <div><strong>${formatChartDate(datum.date)}</strong></div>
            <div>高價：${datum.high.toLocaleString("zh-TW")}</div>
            <div>低價：${datum.low.toLocaleString("zh-TW")}</div>
            <div>平盤：${previousClose?.toLocaleString("zh-TW") ?? "-"}</div>
          `,
        )
        .style("left", `${tooltipX}px`)
        .style("top", `${tooltipY}px`)
        .transition()
        .duration(150)
        .ease(d3.easeCubicOut)
        .style("opacity", 1);
    })
    .on("mouseleave", () => {
      tooltip.interrupt().transition().duration(200).style("opacity", 0);
      crosshair.interrupt().transition().duration(150).style("opacity", 0);
      dot.interrupt().transition().duration(150).style("opacity", 0);
    });
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

  // 等待 API 的過程中，使用者可能已經切到另一個 range
  if (selectedRange.value !== range) {
    return;
  }

  activeRange.value = range;
});

watch(
  [filteredData, chartResizeTick],
  ([data]) => {
    if (data.length < 2) {
      clearChart();
      return;
    }

    void nextTick(() => {
      renderChart(data);
    });
  },
  {
    immediate: true,
  },
);

watch(stockSymbol, () => {
  void loadCurrentSymbol();
});

onMounted(() => {
  const containerElement = chartContainerRef.value;

  if (containerElement && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      chartResizeTick.value += 1;
    });

    resizeObserver.observe(containerElement);
  }

  void loadCurrentSymbol();
});

onBeforeUnmount(() => {
  // 讓仍在進行中的舊 request 回來後直接失效
  latestRequestId += 1;

  resizeObserver?.disconnect();

  clearChart();
});
</script>

<style scoped></style>
