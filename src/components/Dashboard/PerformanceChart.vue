<template>
  <LoadingModal :open="isLoading" message="股市資料載入中"></LoadingModal>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">
        2330.TW 近期趨勢 {{ endClose - startOpen > 0 ? "📈" : "📉" }}
      </h3>

      <div class="flex gap-2 text-xs text-[color:var(--color-secondary)]">
        <div v-for="range in ranges" :key="range.value">
          <button
            @click="selectedRange = range.value"
            class="hover:text-[color:var(--color-primary)] transition-all duration-200 cursor-pointer"
            :class="selectedRange === range.value ? 'font-semibold text-[color:var(--color-primary)]' : ''"
          >
            {{ range.label }}
          </button>｜
        </div>
      </div>
    </div>

    <div
      ref="chartContainerRef"
      class="h-44 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 relative"
    >
      <svg ref="svgRef" class="w-full h-full"></svg>

      <div
        ref="tooltipRef"
        class="absolute bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)] text-xs px-2 py-1 rounded shadow opacity-0 transition-opacity duration-200 pointer-events-none"
      ></div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-secondary)]">
      <div>
        當日成交量
        <span class="font-medium ml-1.5 mt-1">
          {{ latestVolume ? latestVolume.toLocaleString() : "-" }}
        </span>
      </div>
      <div class="text-right">此區間變動：
        <span
          class="font-semibold ml-1.5"
          :class="[
            changePercent < 0
            ? 'text-[color:var(--color-line3)]'
            : 'text-[color:var(--color-line2)]'
          ]"
        >
          {{ changePercent < 0 ? "" : "+" }}{{ (changePercent * 100).toFixed(2) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { mockData2330 } from "@/data/mock/mockData2330.js";
import LoadingModal from "@/components/Common/LoadingModal.vue";

const isLoading = ref(false);

const chartContainerRef = ref(null);
const svgRef = ref(null);
const tooltipRef = ref(null);
const selectedRange = ref("6m");
const transitionDuration = 1000;  // 動畫過渡時間

const stockData = ref([]);

// 當前股號（未來可改由 props 或 Pinia 傳入）
const symbol = "2330";
const earliestYear = 1990;

const startOpen = ref(0);
const endClose = ref(0);

// 動態「是否已過期」判斷
function monthStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
};
function isMaxStale() {
  const last = parsedData.value.at(-1)?.date;
  if (!last) return true;  // 沒資料 → 需要抓
  const now = new Date();
  // 若「最後一筆資料的月份」 < 「本月」，代表少月份，需要補
  return monthStart(last) < monthStart(now);
};

// 最久希望的最早日期（之後可換成「上市年」或由後端提供）
function desiredMaxStart() {
  return new Date(earliestYear, 0, 1);  // 1990-01-01
};

// 向「過去」是否不足（目前最早資料是否晚於期望的最早月）
function isMaxMissingPast() {
  const first = parsedData.value[0]?.date;
  if (!first) return true;
  return monthStart(first) > monthStart(desiredMaxStart());
};

const ranges = [
  { label: "1 日", value: "1d" },
  { label: "5 日", value: "5d" },
  { label: "30 日", value: "30d" },
  { label: "6 個月", value: "6m" },
  { label: "1 年", value: "1y" },
  { label: "5 年", value: "5y" },
  { label: "10 年", value: "10y" },
  { label: "最久", value: "max" }
];

// 從後端取得資料的函式，允許帶查詢參數（用於最久取全史）
async function fetchStockData(params = {}) {
  isLoading.value = true;  // 使用 LoadingModal
  try {
    const qs = new URLSearchParams(params).toString();
    const url = `http://localhost:3000/api/stocks/${symbol}${qs ? "?" + qs : ""}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("後端回傳錯誤");
    const data = await res.json();
    // 合併新舊資料（避免把既有資料覆蓋掉）
    const map = new Map();
    for (const r of stockData.value) map.set(r.date, r);
    for (const r of data) map.set(r.date, r);
    stockData.value = Array.from(map.values()).sort(
      (a, b) => new Date(a.date.replace(/\//g, "-")) - new Date(b.date.replace(/\//g, "-"))
    );
    console.log(`✅ 從後端取得 ${symbol} 資料`, data.length, params);
  } catch (err) {
    console.warn("⚠️ 無法連線伺服器，改用 mockData2330：", err.message);
    stockData.value = mockData2330;
  } finally {
    isLoading.value = false;
  }
}

// 最久 → 直接請 server 回全歷史（1990/01~本月）
function fetchMaxHistory() {
  const now = new Date();
  return fetchStockData({
    startYear: earliestYear,
    startMonth: 1,
    endYear: now.getFullYear(),
    endMonth: now.getMonth() + 1
  });
};

// 補齊「從最後一筆的下個月 → 本月」的缺口
async function fetchMissingToNow() {
  const last = parsedData.value.at(-1)?.date;
  const now = new Date();
  if (!last) {
    // 完全沒有資料 → 走全史
    return fetchMaxHistory();
  };
  return fetchStockData({
    startYear: last.getFullYear(),
    startMonth: last.getMonth() + 1,  // 從「下一個月」開始補
    endYear: now.getFullYear(),
    endMonth: now.getMonth() + 1
  });
};

// 補齊「從期望最早月 → 目前持有的最早月的前一個月」的缺口（向過去）
async function fetchMissingFromPast() {
  const first = parsedData.value[0]?.date;
  if (!first) {
    // 沒資料就直接全史
    return fetchMaxHistory();
  }
  const desired = desiredMaxStart();
  // 從「現有最早月的前一個月」開始，倒著抓到 desired
  const prev = new Date(first.getFullYear(), first.getMonth() - 1, 1);
  return fetchStockData({
    // 起點較新 → 終點較舊，並宣告 backward
    startYear: prev.getFullYear(),
    startMonth: prev.getMonth() + 1,
    endYear: desired.getFullYear(),
    endMonth: desired.getMonth() + 1,
    direction: "backward"
  });
};

// 依區間計算「這次需要的最早日期」
function rangeStartFromNow(range) {
  const now = new Date();
  switch (range) {
    case "1d": return d3.timeDay.offset(now, -1);
    case "5d": return d3.timeDay.offset(now, -5);
    case "30d": return d3.timeDay.offset(now, -30);
    case "6m": return d3.timeMonth.offset(now, -6);
    case "1y": return d3.timeYear.offset(now, -1);
    case "5y": return d3.timeYear.offset(now, -5);
    case "10y": return d3.timeYear.offset(now, -10);
    case "max": return new Date("1990-01-01");
    default:    return new Date("1990-01-01");
  };
};

// 確保資料覆蓋該區間；不足才打 API 補回來
let fetching = false;
async function ensureDataFor(range) {
  if (fetching) return;  // 簡單避免並發
  const needStart = rangeStartFromNow(range);
  const haveStart = parsedData.value[0]?.date;
  if (!haveStart || haveStart > needStart) {
    fetching = true;
    isLoading.value = true;  // 使用 LoadingModal
    try {
      const now = new Date();
      await fetchStockData({
        startYear: needStart.getFullYear(),
        startMonth: needStart.getMonth() + 1,
        endYear: now.getFullYear(),
        endMonth: now.getMonth() + 1
      });
    } finally {
      fetching = false;
      isLoading.value = false;
    };
  };
};

// 整理資料：將日期轉換為可排序格式
const parsedData = computed(() =>
  stockData.value.map(d => ({
    ...d,
    date: new Date(d.date.replace(/\//g, "-"))
  })).sort((a, b) => a.date - b.date)
);

// 根據選擇的區間過濾資料
const filteredData = computed(() => {
  const now = parsedData.value.at(-1)?.date || new Date();
  let cutoff;
  switch (selectedRange.value) {
    case "1d": cutoff = d3.timeDay.offset(now, -1); break;
    case "5d": cutoff = d3.timeDay.offset(now, -5); break;
    case "30d": cutoff = d3.timeDay.offset(now, -30); break;
    case "6m": cutoff = d3.timeMonth.offset(now, -6); break;
    case "1y": cutoff = d3.timeYear.offset(now, -1); break;
    case "5y": cutoff = d3.timeYear.offset(now, -5); break;
    case "10y": cutoff = d3.timeYear.offset(now, -10); break;
    default: cutoff = parsedData.value[0]?.date ?? new Date(0);
  }
  return parsedData.value.filter((d) => d.open !== null)
                         .filter((d) => d.date >= cutoff);
});

// D3 繪圖函式
function drawChart(data) {
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  const width = chartContainerRef.value.clientWidth;
  const height = chartContainerRef.value.clientHeight;
  const margin = { top: 10, right: 40, bottom: 40, left: 40 };

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
  const lineColor = endClose.value > startOpen.value
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

  const crosshair = svg.append("line")
                       .attr("stroke", "var(--color-border)")
                       .attr("stroke-width", 1)
                       .attr("y1", margin.top)
                       .attr("y2", height - margin.bottom)
                       .style("opacity", 0);

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

                       // crosshair 與 dot 平滑顯示
                       crosshair.transition()
                                .duration(80)
                                .attr("x1", xScale(d.date))
                                .attr("x2", xScale(d.date))
                                .style("opacity", 0.6);

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

// 監聽 filteredData 與 resize
const resizeObserver = new ResizeObserver(() => drawChart(filteredData.value));

// 監聽切換區間時重畫
watch(filteredData, (val) => {
  nextTick(() => drawChart(val));
}, { immediate: true });

// 切換區間時「先確保資料覆蓋」，只有不足才打 API
watch(selectedRange, async (val) => {
  if (val === "max") {
    // 同時檢查「向過去」與「向未來」是否不足；只補缺口
    const tasks = [];
    if (isMaxMissingPast()) tasks.push(fetchMissingFromPast());
    if (isMaxStale())       tasks.push(fetchMissingToNow());
    if (tasks.length) await Promise.all(tasks);
  } else {
    await ensureDataFor(val);
  };
});

// 顯示當日成交量與變動
const latestVolume = computed(() => {
  const last = parsedData.value.at(-1);
  return last && typeof last.volume === "number" ? last.volume : null;
});
const changePercent = computed(() => {
  if (!endClose.value || !startOpen.value) return "0.00";
  return (endClose.value - startOpen.value) / startOpen.value;
});

onMounted(async () => {
  resizeObserver.observe(chartContainerRef.value);
  // 初次載入抓「今年到本月」；之後依需要擴充
  const now = new Date();
  await fetchStockData({
    startYear: now.getFullYear(),
    startMonth: 1,
    endYear: now.getFullYear(),
    endMonth: now.getMonth() + 1
  });
  nextTick(() => drawChart(filteredData.value));
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style scoped></style>
