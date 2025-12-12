<template>
  <LoadingModal :open="isLoading" message="價格資料載入中..."></LoadingModal>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="font-medium text-[color:var(--color-secondary)]">
        價格走勢（{{ props.currentTimeframe }}）
        <div class="inline-flex items-baseline text-xs px-2.5 py-1 rounded-full border bg-[color:var(--color-card)] border-[color:var(--color-border)] shadow-sm">
          <span class="tracking-[0.1em] uppercase text-[color:var(--color-secondary)]/75 mx-1">區間漲跌幅</span>
          <span
            class="font-semibold tabular-nums"
            :class="[
              changePercent < 0
              ? 'text-[color:var(--color-line3)]'
              : 'text-[color:var(--color-line2)]'
            ]"
          >
            {{ changePercent < 0 ? "▼" : "▲" }}{{ (Math.abs(changePercent) * 100).toFixed(2) }}%
          </span>
        </div>
      </div>
      <div class="text-xs text-[color:var(--color-secondary)]">最後更新：{{ props.lastUpdated.toLocaleString() }}</div>
    </div>

    <div
      ref="chartContainerRef"
      class="relative h-72 md:h-96 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-80"
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

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  startOpen.value = data[0]?.open ?? 0;  // 最初日開盤價
  endClose.value = data.at(-1)?.close ?? 0;  // 最末日收盤價

  // 區間除 "7D" 以外都啟用「壓縮 X 軸（等距交易日）」模式
  const useCompressed = effectiveRange.value !== "7D";

  // 設定比例尺
  // X 比例尺中，"7D" 用 time scale，其餘用 index scale（0 ~ N-1）
  let xScale;
  if (useCompressed) {
    const edgePadding = 0.5;  // 左右各保留 0.5 格
    xScale = d3.scaleLinear()
               .domain([0 - edgePadding, (data.length - 1) + edgePadding])
               .range([margin.left, width - margin.right]);
  } else {
    // "7D" 用 time scale → 自己加「0.5 天 padding」
    const [minDate, maxDate] = d3.extent(data, d => d.date);
    const dayMs = 24 * 60 * 60 * 1000;
    xScale = d3.scaleTime()
               .domain([
                 new Date(minDate.getTime() - dayMs * 0.5),  // 左邊多 0.5 天
                 new Date(maxDate.getTime() + dayMs * 0.5),  // 右邊多 0.5 天
               ])
               .range([margin.left, width - margin.right]);
  }

  const yScale = d3.scaleLinear()
                   .domain([
                     d3.min(data, d => (d.low ?? d.close ?? d.open)),
                     d3.max(data, d => (d.high ?? d.close ?? d.open))
                   ])
                   .range([height - margin.bottom, margin.top])
                   .nice();


  // === 軸線繪製 ===
  // long-term 區間判斷
  const isLongRange = effectiveRange.value === "1Y" || effectiveRange.value === "3Y";
  const axisDateFormat = isLongRange
    ? d3.timeFormat("%Y/%m")   // 1Y / 3Y → 年 + 月
    : d3.timeFormat("%m/%d");  // 短期 → 月 + 日

  // X 軸 → 壓縮模式用 index + 自定 tick label；7D 用 time scale
  let xAxisGenerator;
  if (useCompressed) {
    const tickCount = isLongRange ? 6 : 5;
    const tickIndex = d3.ticks(0, Math.max(0, data.length - 1), tickCount);
    xAxisGenerator = d3.axisBottom(xScale)
                       .tickValues(tickIndex)
                       .tickFormat(i => {
                         const idx = Math.round(i);
                         const d = data[idx];
                         return d ? axisDateFormat(d.date) : "";
                       })
                       .tickSizeOuter(0);
  } else {
    const tickCount = isLongRange ? 6 : 5;
    xAxisGenerator = d3.axisBottom(xScale)
                       .ticks(tickCount)
                       .tickFormat(axisDateFormat);
  }
        
  const yAxisGenerator = d3.axisLeft(yScale)
                           .ticks(5)
                           .tickSizeOuter(0);

  const xAxis = svg.append("g")
                   .attr("transform", `translate(0, ${height - margin.bottom})`)
                   .call(xAxisGenerator)
                   .attr("color", "var(--color-text)")
                   .attr("opacity", 0.6);
  xAxis.selectAll("path").remove();  // 消掉 X 軸的橫線

  const yAxis = svg.append("g")
                   .attr("transform", `translate(${margin.left},0)`)
                   .call(yAxisGenerator)
                   .attr("color", "var(--color-text)")
                   .attr("opacity", 0.6);
  yAxis.selectAll("path").remove();  // 消掉 Y 軸橫線

  // 畫出顏色較淡的 Y 軸刻度延伸線
  yAxis.selectAll(".tick")  // '.tick'為預設的class名稱
       .append("line")
       .attr("x1", 0)
       .attr("x2", width - margin.left - margin.right)
       .attr("y1", 0)
       .attr("y2", 0)
       .attr("stroke", "var(--color-border)");


  // 統一計算 X 座標的 helper，依模式決定用 index or date
  const xPos = (d, i) => useCompressed ? xScale(i) : xScale(d.date);

  // 計算每根 K 棒的寬度
  let candleWidth = 4;  // fallback
  if (data.length > 1) {
    if (useCompressed) {
      const x1 = xScale(0);
      const x2 = xScale(1);
      candleWidth = Math.max(
        effectiveRange.value === "3Y" ? 1 : 2,  // long-term 區間允許更細一點
        (x2 - x1) * 0.6  // 相鄰兩天距離的 60%
      );
    } else {
      const x1 = xScale(data[0].date);
      const x2 = xScale(data[1].date);
      candleWidth = Math.max(2, (x2 - x1) * 0.6);  // 相鄰兩天距離的 60%
    }
  }

  // clipPath → 用來做「從左到右揭開」的動畫
  const clipId = `price-clip-${Math.random().toString(36).slice(2, 9)}`;
  const clipRect = svg.append("clipPath")
                      .attr("id", clipId)
                      .append("rect")
                      .attr("x", margin.left)
                      .attr("y", margin.top)
                      .attr("width", 0)  // 一開始看不到
                      .attr("height", plotHeight);

  // 所有「實際圖形」（K 線 / 折線 / 未來的 MA 線），都掛在這個 group 底下
  const mainGroup = svg.append("g")
                       .attr("clip-path", `url(#${clipId})`);


  // === K 線繪製 → 上下影線 + 實體 ===
  const candleGroup = mainGroup.append("g")
                               .attr("stroke-linecap", "round");

  // 上下影線（low ~ high）
  candleGroup.selectAll("line.stem")
             .data(data)
             .join("line")
             .attr("class", "stem")
             .attr("x1", (d, i) => xPos(d, i))
             .attr("x2", (d, i) => xPos(d, i))
             .attr("y1", d => yScale(d.low ?? d.close ?? d.open))
             .attr("y2", d => yScale(d.high ?? d.close ?? d.open))
             .attr("stroke", "var(--color-text)")
             .attr("stroke-width", 1);

  // K 棒顏色
  const upColor = "var(--color-line2)";      // 上漲色
  const downColor = "var(--color-line3)";    // 下跌色
  const flatColor = "var(--color-text)";     // 平盤色

  // 實體（open ~ close）
  candleGroup.selectAll("rect.body")
             .data(data)
             .join("rect")
             .attr("class", "body")
             .attr("x", (d, i) => xPos(d, i) - candleWidth / 2)
             .attr("width", candleWidth)
             .attr("y", d => yScale(Math.max(d.open, d.close)))
             .attr("height", d => {
               const h = Math.abs(yScale(d.open) - yScale(d.close));
               return Math.max(1, h);  // 避免 open == close 時高度為 0 看不到
             })
             .attr("fill", d => {
               if (d.close > d.open) return upColor;
               if (d.close < d.open) return downColor;
               return flatColor;
             })
             .attr("rx", Math.min(2, candleWidth / 2))
             .attr("ry", Math.min(2, candleWidth / 2));

  // === 折線繪製 ===
  // 淡色折線（close 串起來）
  const line = d3.line()
                 .x((d, i) => xPos(d, i))  // 支援壓縮 / 非壓縮模式
                 .y((d) => yScale(d.close))
                 .curve(d3.curveMonotoneX);

  // 動態設定線段顏色
  const lineColor = endClose.value >= startOpen.value
    ? "var(--color-line2)"
    : "var(--color-line3)";

  // 畫線
  const path = mainGroup.append("path")
                        .datum(data)
                        .attr("fill", "none")
                        .attr("stroke", lineColor)
                        .attr("stroke-width", 1.5)
                        .attr("stroke-opacity", 0.3)  // 淡淡的，不喧賓奪主
                        .attr("d", line);

  // 用 clipRect 做從左到右的 reveal 動畫 → K 線 + 折線一起
  clipRect.transition()
          .duration(transitionDuration)
          .ease(d3.easeCubicOut)
          .attr("width", plotWidth);


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
                              .attr("x2", width - margin.right);

  const dot = svg.append("circle")
                 .attr("r", 2.3)
                 .attr("fill", "var(--color-text)")
                 .style("opacity", 0);

  const overlay = svg.append("rect")
                     .attr("fill", "transparent")
                     .attr("width", width)
                     .attr("height", height)
                     .on("mousemove", function (e) {
                       const [mx] = d3.pointer(e);

                       // 根據模式取得 index
                       let i;
                       if (useCompressed) {
                         const xIndex = xScale.invert(mx);
                         i = Math.round(xIndex);
                       } else {
                         const xDate = xScale.invert(mx);
                         i = bisect(data, xDate);
                       }
                       i = Math.min(Math.max(0, i), data.length - 1);  // clamp
                       const d = data[i];
                     
                       const xCoord = xPos(d, i);  // 統一 X 位置

                       // 兩條 crosshair 與 dot 平滑顯示
                       crosshair.style("opacity", 0.9);
                       crosshairX.transition()
                                 .duration(80)
                                 .attr("x1", xCoord)
                                 .attr("x2", xCoord);
                       crosshairY.transition()
                                 .duration(80)
                                 .attr("y1", yScale(d.close))
                                 .attr("y2", yScale(d.close));

                       dot.transition()
                          .duration(80)
                          .attr("cx", xCoord)
                          .attr("cy", yScale(d.close))
                          .style("opacity", 1);

                       // tooltip ，使用防溢出邏輯
                       const tipWidth = 160;
                       const tipHeight = 70;
                       let tipX = xCoord + 30;   // 預設顯示在右上角
                       let tipY = yScale(d.close) - tipHeight - 10;
                       if (tipX + tipWidth > width) tipX = xCoord - tipWidth + 40;
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


// UI 顯示區間報酬百分比
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
