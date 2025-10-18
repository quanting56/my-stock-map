<template>
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
      <div>當日成交量<span class="font-medium ml-1.5 mt-1">{{ latestVolume.toLocaleString() }}</span></div>
      <div class="text-right">最近變動：
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
// 新增 import 與 setup
import * as d3 from "d3";
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { mockData2330 } from "@/data/mock/mockData2330.js";

const chartContainerRef = ref(null);
const svgRef = ref(null);
const tooltipRef = ref(null);
const selectedRange = ref("6m");
const transitionDuration = 1000;  // 動畫過渡時間

const startOpen = ref(0);
const endClose = ref(0);

const ranges = [
  { label: "1 日", value: "1d" },
  { label: "5 日", value: "5d" },
  { label: "30 日", value: "30d" },
  { label: "6 個月", value: "6m" },
  { label: "1 年", value: "1y" },
  { label: "5 年", value: "5y" },
  { label: "最久", value: "max" }
];

// 將日期轉換為可排序格式
const parsedData = mockData2330.map(d => ({
  ...d,
  date: new Date(d.date.replace(/\//g, "-"))
})).sort((a, b) => a.date - b.date);

// 選擇範圍時加入漸變動畫
function changeRange(val) {
  selectedRange.value = val;
}

// 根據選擇的區間過濾資料
const filteredData = computed(() => {
  const now = parsedData.at(-1)?.date || new Date();
  let cutoff;
  switch (selectedRange.value) {
    case "1d": cutoff = d3.timeDay.offset(now, -1); break;
    case "5d": cutoff = d3.timeDay.offset(now, -5); break;
    case "30d": cutoff = d3.timeDay.offset(now, -30); break;
    case "6m": cutoff = d3.timeMonth.offset(now, -6); break;
    case "1y": cutoff = d3.timeYear.offset(now, -1); break;
    case "5y": cutoff = d3.timeYear.offset(now, -5); break;
    default: cutoff = parsedData[0].date;
  }
  return parsedData.filter((d) => d.open !== null)
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
                   .domain([d3.min(data, d => d.low) , d3.max(data, d => d.high)])
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
                       crosshair.transition().duration(80)
                         .attr("x1", xScale(d.date))
                         .attr("x2", xScale(d.date))
                         .style("opacity", 0.6);

                       dot.transition().duration(80)
                         .attr("cx", xScale(d.date))
                         .attr("cy", yScale(d.close))
                         .style("opacity", 1);

                       // tooltip 使用 left/top，避免 transform 導致定位不穩
                       tip.transition().duration(150).style("opacity", 1);
                       tip.style("left", `${xScale(d.date) + 25}px`)
                          .style("top", `${yScale(d.close) - 40}px`)
                          .html(`
                            <div><strong>${d3.timeFormat("%Y/%m/%d")(d.date)}</strong></div>
                            <div>高價: ${d.high.toLocaleString()}</div>
                            <div>低價: ${d.low.toLocaleString()}</div>
                            <div>平盤: ${i > 0 ? data[i - 1].close.toLocaleString() : "-"} </div>
                          `);
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

// 顯示當日成交量與變動
const latestVolume = computed(() => parsedData.at(-1)?.volume);
const changePercent = computed(() => {
  if (!endClose.value || !startOpen.value) return "0.00";
  return ((endClose.value - startOpen.value) / startOpen.value);
});

onMounted(() => {
  resizeObserver.observe(chartContainerRef.value);
  nextTick(() => drawChart(filteredData.value));
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style scoped></style>
