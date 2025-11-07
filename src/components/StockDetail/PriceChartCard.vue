<template>
  <LoadingModal :open="isLoading" message="價格資料載入中"></LoadingModal>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="font-medium text-[color:var(--color-secondary)]">價格走勢（{{ props.currentTimeframe }}）</div>
      <div class="text-xs text-[color:var(--color-secondary)]">最後更新：{{ props.lastUpdated.toLocaleString() }}</div>
    </div>

    <div
      ref="chartContainerRef"
      class="relative h-72 md:h-96 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70"
    >
      <svg ref="svgRef" class="w-full h-full"></svg>
      <div
        ref="tooltipRef"
        class="absolute bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)] text-xs px-2 py-1 rounded shadow opacity-0 transition-opacity duration-200 pointer-events-none"
      ></div>
    </div>

    <!-- 下方技術指標小卡 -->
    <IndicatorSummaryCards :indicator-summary-data="filteredData"></IndicatorSummaryCards>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import LoadingModal from "@/components/Common/LoadingModal.vue";
import IndicatorSummaryCards from "@/components/StockDetail/PriceChartCard/IndicatorSummaryCards.vue";
import { useQueryStockStore } from "@/store/queryStock.js";

// fetchStockSeries 直接拿可繪圖資料；normalizeStockRows 用來正規化 mockData
import { fetchStockSeries, normalizeStockRows } from "@/api/stocksApi.js";
import { mockData2330 } from "@/data/mock/mockData2330.js";

const props = defineProps({
  currentTimeframe: String,
  lastUpdated: Date,
});

const isLoading = ref(false);


// Pinia 全站同步股號
const queryStock = useQueryStockStore();
const symbol = computed(() => queryStock.symbol);  // 邏輯用
const displaySymbol = computed(() => queryStock.displaySymbol);  // 模板顯示用


// DOM ref
const chartContainerRef = ref(null);
const svgRef = ref(null);
const tooltipRef = ref(null);


const propRange = computed(() => props.currentTimeframe);
const earliestYear = 1990;  // 「max」起始年（本 SFC 無 max，但保留共用邏輯）

// const selectedRange = ref("6m");  // 預設顯示「6個月」
const effectiveRange = ref(propRange.value);  // 真正驅動圖表的有效區段，資料就緒時才切過去（沒有computed，不會自動隨著propRange改變而跟著變）
const transitionDuration = 1000;  // 動畫過渡時間

const rangeData = ref([]);  // 所選資料暫存


// 由 range 推回起始日
function fromDateByRange(range, baseDate, earliest = earliestYear) {
  switch (range) {
    case "7D":  return d3.timeDay.offset(baseDate, -7);
    case "1M": return d3.timeDay.offset(baseDate, -30);
    case "3M":  return d3.timeMonth.offset(baseDate, -3);
    case "1Y":  return d3.timeYear.offset(baseDate, -1);
    case "3Y":  return d3.timeYear.offset(baseDate, -3);
    case "max": return new Date(earliest, 0, 1);  // 本 SFC 無 max，但保留作為共用邏輯
    default:    return d3.timeDay.offset(baseDate, -30);
  };
};

// 區間首尾的指標價，提供給 UI 顯示趨勢符號/漲跌百分比
const startOpen = ref(0);
const endClose = ref(0);


// 前端快取（避免同參數重打），請求序號（避免競態覆蓋）
const cacheMap = new Map();  // key: `${symbol}|${startYear}-${startMonth}~${endYear}-${endMonth}`
let requestId = 0;

function makeKey(sym, p) {
  return `${sym}|${p.startYear}-${p.startMonth}~${p.endYear}-${p.endMonth}`;
};


// 前端「所選區間」 -> 後端「API 所需的起訖年月（含「max」）」
function paramsForRange(range) {
  const now = new Date();
  const to = { endYear: now.getFullYear(), endMonth: now.getMonth() + 1 };
  const fromDate = fromDateByRange(range, now, earliestYear);
  return {
    startYear: fromDate.getFullYear(),
    startMonth: fromDate.getMonth() + 1,
    ...to
  };
};

// 呼叫後端依「參數」回傳完整區間
async function fetchStockData(params = {}) {
  isLoading.value = true;  // 使用 LoadingModal
  const key = makeKey(symbol.value, params);

  if (cacheMap.has(key)) {  // 快取命中 → 直接用
    const cached = cacheMap.get(key);
    
    if (rangeData.value === cached) {
      isLoading.value = false;
      return;
    }  // 若目前 rangeData 已是同一參考，就不要再次 set（避免重畫）

    rangeData.value = cached;
    isLoading.value = false;
    return;
  };
  const myId = ++requestId;  // 標記這次請求
  try {
    const data = await fetchStockSeries(symbol.value, params);  // 取得「已正規化、已排序」的 StockBar[]
    if (myId !== requestId) return;  // 舊回應丟棄
    cacheMap.set(key, data);  // 寫入快取
    rangeData.value = data;
    currentKey.value = key;  // 記錄目前使用的資料 key
    console.log(`✅ 從後端取得 ${symbol.value} 資料`, data.length, params);
  } catch (err) {
    if (myId !== requestId) return;  // 舊錯誤丟棄
    console.warn("⚠️ 無法連線伺服器，改用 mockData2330：", err.message);
    rangeData.value = /^2330(?:\.TW)?$/i.test(displaySymbol.value)
      ? normalizeStockRows(symbol.value, mockData2330)
      : [];  // mockData 轉成 StockBar[]
  } finally {
    if (myId === requestId) isLoading.value = false;  // 僅關閉當前請求的 loading
  };
};

// 根據 effectiveRange 過濾資料，避免在資料未就緒時就重畫
const filteredData = computed(() => {
  const now = rangeData.value.at(-1)?.date || new Date();
  const cutoff = rangeData.value.length
    ? fromDateByRange(effectiveRange.value, now, earliestYear)
    : new Date(0);
  return rangeData.value
    .filter(d => d.high !== null)
    .filter(d => d.date >= cutoff);
});

// 判斷目前本地資料是否覆蓋某個 range 的截止點
function hasCoverageFor(range) {
  if (!rangeData.value.length) return false;
  const now = rangeData.value.at(-1)?.date || new Date();
  const cutoff = fromDateByRange(range, now, earliestYear);
  const earliest = rangeData.value[0].date;
  // 只要本地最早日期 <= 目標 cutoff，就代表資料足夠，不必打 API
  return earliest <= cutoff;
};

// 記住目前使用中的「後端參數 key」，避免對同一 key 重複 set 造成重畫
const currentKey = ref("");

watch(propRange, async (val) => {
  // 本地足夠 → 直接切到有效區段（立即只畫一次）
  if (hasCoverageFor(val)) {
    effectiveRange.value = val;
    return;
  };
  
  // 本地不足 → 先補資料，補好再切到有效區段（只畫一次，新資料）
  const params = paramsForRange(val);
  const key = makeKey(symbol.value, params);
  if (key !== currentKey.value) {
    await fetchStockData(params);
    currentKey.value = key;
  }
  effectiveRange.value = val;
});


// D3 繪圖函式
function drawChart(data) {
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  const width = chartContainerRef.value.clientWidth;
  const height = chartContainerRef.value.clientHeight;
  const margin = { top: 30, right: 20, bottom: 40, left: 40 };

  startOpen.value = data[0]?.open ?? 0;  // 最初日開盤價
  endClose.value = data.at(-1)?.close ?? 0;  // 最末日收盤價

  // 設定比例尺
  const xScale = d3.scaleTime()
                   .domain(d3.extent(data, d => d.date))
                   .range([margin.left, width - margin.right])
                   .nice();

  const yScale = d3.scaleLinear()
                   .domain([
                     d3.min(data, d => (d.low ?? d.close ?? d.open)),
                     d3.max(data, d => (d.high ?? d.close ?? d.open))
                   ])
                   .range([height - margin.bottom, margin.top])
                   .nice();

  const line = d3.line()
                 .x(d => xScale(d.date))
                 .y(d => yScale(d.close))
                 .curve(d3.curveMonotoneX);

  // 動態設定線段顏色
  const lineColor = endClose.value >= startOpen.value
    ? "var(--color-line2)"
    : "var(--color-line3)";

  // 畫線
  const path = svg.append("path")
                  .datum(data)
                  .attr("fill", "none")
                  .attr("stroke", lineColor)
                  .attr("stroke-width", 2)
                  .attr("d", line);

  // 線條過渡動畫
  const totalLength = path.node().getTotalLength();
  path.attr("stroke-dasharray", totalLength + " " + totalLength)
      .attr("stroke-dashoffset", totalLength)
      .transition()
      .duration(transitionDuration)
      .ease(d3.easeCubicOut)
      .attr("stroke-dashoffset", 0);

  // 畫軸線
  const xAxis = d3.axisBottom(xScale)
                  .ticks(5)
                  .tickFormat(d3.timeFormat("%Y/%m/%d"));
        
  const yAxis = d3.axisLeft(yScale)
                  .ticks(5);

  svg.append("g")
     .attr("transform", `translate(0, ${height - margin.bottom})`)
     .call(xAxis)
     .attr("color", "var(--color-text)")
     .attr("opacity", 0.6);

  svg.append("g")
     .attr("transform", `translate(${margin.left},0)`)
     .call(yAxis)
     .attr("color", "var(--color-text)")
     .attr("opacity", 0.6);


  // Tooltip
  const tip = d3.select(tooltipRef.value);
  const bisect = d3.bisector(d => d.date).left;

  const crosshair = svg.append("g")
                       .attr("class", "crosshair")
                       .style("opacity", 0);
                       
  const crosshairX = crosshair.append("line")
                              .attr("stroke", "var(--color-border)")
                              .attr("stroke-width", 1)
                              .attr("y1", margin.top)
                              .attr("y2", height - margin.bottom);

  const crosshairY = crosshair.append("line")
                              .attr("stroke", "var(--color-border)")
                              .attr("stroke-width", 1)
                              .attr("x1", margin.left)
                              .attr("x2", width - margin.left);

  const dot = svg.append("circle")
                 .attr("r", 4)
                 .attr("fill", lineColor)
                 .style("opacity", 0);

  const overlay = svg.append("rect")
                     .attr("fill", "transparent")
                     .attr("width", width)
                     .attr("height", height)
                     .on("mousemove", function (e) {
                       const [mx] = d3.pointer(e);
                       const xDate = xScale.invert(mx);
                       const i = bisect(data, xDate);
                       const d = data[Math.min(Math.max(i, 0), data.length - 1)];

                       // 兩條 crosshair 與 dot 平滑顯示
                       crosshair.style("opacity", 0.9);
                       crosshairX.transition()
                                 .duration(80)
                                 .attr("x1", xScale(d.date))
                                 .attr("x2", xScale(d.date));
                       crosshairY.transition()
                                 .duration(80)
                                 .attr("y1", yScale(d.close))
                                 .attr("y2", yScale(d.close));

                       dot.transition()
                          .duration(80)
                          .attr("cx", xScale(d.date))
                          .attr("cy", yScale(d.close))
                          .style("opacity", 1);

                       // tooltip ，使用防溢出邏輯
                       const tipWidth = 160;
                       const tipHeight = 70;
                       let tipX = xScale(d.date) + 30;   // 預設顯示在右上角
                       let tipY = yScale(d.close) - tipHeight - 10;
                       if (tipX + tipWidth > width) tipX = xScale(d.date) - tipWidth + 40;
                       if (tipY < 0) tipY = yScale(d.close) + 10;

                       tip.html(`
                            <div><strong>${d3.timeFormat("%Y/%m/%d")(d.date)}</strong></div>
                            <div>高價: ${d.high.toLocaleString()}</div>
                            <div>低價: ${d.low.toLocaleString()}</div>
                            <div>平盤: ${i > 0 ? data[i - 1].close.toLocaleString() : "-"}</div>
                          `)
                          .transition()
                          .duration(150)
                          .ease(d3.easeCubicOut)
                          .style("opacity", 1)
                          .style("left", `${tipX}px`)
                          .style("top", `${tipY}px`);
                     })
                     .on("mouseleave", () => {
                       tip.transition().duration(200).style("opacity", 0);
                       crosshair.transition().duration(150).style("opacity", 0);
                       dot.transition().duration(150).style("opacity", 0);
                     });
};


// 由尺寸 tick 觸發同一個 watch，避免與 filteredData 各畫一次
const resizeTick = ref(0);
const resizeObserver = new ResizeObserver(() => { resizeTick.value++; });


// 資料變更 或 尺寸變更，圖形只畫一次
watch([filteredData, resizeTick], ([val]) => {
  if (!val || val.length < 2) return;  // 避免空畫面與單點重畫
  nextTick(() => drawChart(val));
}, { immediate: true });


// 當全站 symbol 改變（換標的） → 抓新資料
async function primeSymbol() {
  await fetchStockData(paramsForRange(propRange.value));
  effectiveRange.value = propRange.value;  // 確保初次視窗一致
};
watch(() => symbol.value, () => { primeSymbol(); });


// UI 顯示最末日成交量 & 區間報酬百分比
const latestVolume = computed(() => {
  const last = rangeData.value.at(-1);
  return last && typeof last.volume === "number" ? last.volume : null;
});

const changePercent = computed(() => {
  if (!endClose.value || !startOpen.value) return 0;
  return (endClose.value - startOpen.value) / startOpen.value;
});


onMounted(async () => {
  resizeObserver.observe(chartContainerRef.value);
  await primeSymbol();
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style scoped></style>
