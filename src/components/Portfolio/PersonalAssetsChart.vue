<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">
        個人資產變化趨勢 📈
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
      class="h-64 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3 relative"
    >
      <svg ref="svgRef" class="w-full h-full"></svg>
      <div
        ref="tooltipRef"
        class="absolute bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)] text-xs px-2 py-1 rounded shadow opacity-0 transition-opacity duration-200 pointer-events-none"
      ></div>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-secondary)]">
      <div class="text-gray-500">（預留文字空間）</div>
      <div class="text-right">此區間資產變動：
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
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
import { assetsMockData } from "@/data/mock/assetsMockData.js";

const chartContainerRef = ref(null);
const svgRef = ref(null);
const tooltipRef = ref(null);
const selectedRange = ref("6m");
const transitionDuration = 1000;  // 動畫過渡時間

const startTotalValue = ref(0);
const endTotalValue = ref(0);
const changePercent = computed(() => {
  if (!endTotalValue.value || !startTotalValue.value) return "0.00";
  return (endTotalValue.value - startTotalValue.value) / startTotalValue.value;
});

const ranges = [
  { label: "1 週", value: "7d" },
  { label: "1 個月", value: "30d" },
  { label: "1 季", value: "3m" },
  { label: "半年", value: "6m" },
  { label: "1 年", value: "1y" },
  { label: "5 年", value: "5y" },
  { label: "最久", value: "max" }
];

// 銀行顏色表
// const bankColors = {
//   "台新銀行": "#E60012",   // 紅
//   "合作金庫銀行": "#1B73B5", // 藍
//   "郵局": "#009944",       // 綠
//   "國泰世華銀行": "#007C3E", // 深綠
//   "當日持股市值": "#888888" // 灰
// };

// mockData 銀行顏色表
const bankColors = {
  "台新銀行": "#a5a5a5",   // 紅
  "合作金庫銀行": "#f5ba1a", // 藍
  "郵局": "#e37933",       // 綠
  "國泰世華銀行": "#6ea647", // 深綠
  "當日持股市值": "#406cb4" // 灰
};

// 整理資料：將日期解析成 Date + 取得資產總值
const parsedData = assetsMockData.map(d => {
  // 過濾出所有 key 中非日期的數值欄位
  const values = Object.keys(d)
                       .filter((k) => k !== "日期")  // 不要日期
                       .map(k => {
                         if (d[k] === "" || d[k] == null) return null;
                         const num = Number(String(d[k]).replace(/,/g, ""));
                         return Number.isFinite(num) ? num : null;
                       })  // 取出值，並轉成 Number
                       .filter((v) => v != null && !isNaN(v))  // 排除 null 或 NaN

  return {
    ...d,
    date: new Date(d["日期"].replace(/\//g, "-")),
    totalValue: d3.sum(values)
  };
}).sort((a, b) => a.date - b.date);

// 取得所有銀行欄位（包含"當日持股市值"，但排除"日期"）
const banks = Object.keys(parsedData[0]).filter(k => !["日期", "date"].includes(k));

// 根據選擇的區間過濾資料
const filteredData = computed(() => {
  const now = parsedData.at(-1)?.date || new Date();
  let cutoff;
  switch (selectedRange.value) {
    case "7d": cutoff = d3.timeDay.offset(now, -7); break;
    case "30d": cutoff = d3.timeDay.offset(now, -30); break;
    case "3m": cutoff = d3.timeMonth.offset(now, -3); break;
    case "6m": cutoff = d3.timeMonth.offset(now, -6); break;
    case "1y": cutoff = d3.timeYear.offset(now, -1); break;
    case "5y": cutoff = d3.timeYear.offset(now, -5); break;
    default: cutoff = parsedData[0].date;
  }
  return parsedData.filter((d) => d.date && d.date >= cutoff);
});

// D3 繪圖函式
function drawChart(data) {
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  const width = chartContainerRef.value.clientWidth;
  const height = chartContainerRef.value.clientHeight;
  const margin = { top: 10, right: 60, bottom: 40, left: 60 };

  startTotalValue.value = data[0]?.totalValue ?? 0;  // 區間最初日總資產
  endTotalValue.value = data.at(-1)?.totalValue ?? 0;  // 區間最末日總資產

  const xScale = d3.scaleTime()
                   .domain(d3.extent(data, d => d.date))
                   .range([margin.left, width - margin.right])
                   .nice();

  const yScale = d3.scaleLinear()
                   .domain([0, d3.max(data, d => d.totalValue)])
                   .range([height - margin.bottom - 30, margin.top])
                   .nice();

  const lineGen = d3.line()
                    .defined(d => d.value !== null)
                    .x(d => xScale(d.date))
                    .y(d => yScale(d.value))
                    .curve(d3.curveMonotoneX);

  // dots 容器
  const dotsGroup = svg.append("g");

  // 為每間銀行畫線
  banks.forEach(bank => {
    const depositInTheBank = data.map(d => ({ date: d.date, value: d[bank] }));

    const path = svg.append("path")
      .datum(depositInTheBank)
      .attr("fill", "none")
      .attr("stroke", bankColors[bank] || "#000000")
      .attr("stroke-width", 2)
      .attr("d", lineGen);

    // 動畫效果
    const totalLength = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${totalLength} ${totalLength}`)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(transitionDuration)
        .ease(d3.easeCubicOut)
        .attr("stroke-dashoffset", 0);

    dotsGroup.append("circle")
             .attr("r", 4)
             .attr("fill", bankColors[bank])
             .style("opacity", 0)
             .attr("class", `dot-${bank}`);
  });

  // 加上座標軸
  const xAxis = d3.axisBottom(xScale)
                  .ticks(6)
                  .tickFormat(d3.timeFormat("%Y/%m/%d"));
  const yAxis = d3.axisLeft(yScale)
                  .ticks(5);

  svg.append("g")
     .attr("transform", `translate(0, ${height - margin.bottom - 30})`)
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

                       // 更新所有 dots 的位置
                       banks.forEach(bank => {
                         const val = d[bank];
                         const dot = svg.select(`.dot-${bank}`);
                         if (val != null) {
                           dot.transition()
                              .duration(150)
                              .ease(d3.easeCubicOut)
                              .attr("cx", xScale(d.date))
                              .attr("cy", yScale(val))
                              .style("opacity", 1);
                         } else {
                           dot.style("opacity", 0);
                         }
                       });

                       // Tooltip 內容
                       const rows = banks.map(bank => {
                         const val = d[bank];
                         return `<div><span style="color: ${bankColors[bank]};">●</span> ${bank}: ${val ? val.toLocaleString() + " 元" : "-"}</div>`;
                       }).join("");
                       const totalStr = `<div><strong>總資產：</strong>${d.totalValue.toLocaleString()} 元</div>`;

                       // Tooltip 防溢出邏輯
                       const tipWidth = 160;
                       const tipHeight = 80;
                       let tipX = xScale(d.date) + 40;
                       let tipY = yScale(d.totalValue) - 60;
                       if (tipX + tipWidth > width) tipX = xScale(d.date) - tipWidth - 20;  // 避免超出右側
                       if (tipY < 0) tipY = yScale(d.totalValue) + 20;

                       tip.html(`
                            <strong>${d3.timeFormat("%Y/%m/%d")(d.date)}</strong>
                            ${rows}
                            ${totalStr}
                          `)
                          .transition()
                          .duration(150)
                          .ease(d3.easeCubicOut)
                          .style("opacity", 1)
                          // .style("left", `${xScale(d.date) + 20}px`)
                          .style("left", `${tipX}px`)
                          .style("top", `${tipY}px`);
                     })
                     .on("mouseleave", () => {
                       tip.transition().duration(200).style("opacity", 0);
                       crosshair.transition().duration(150).style("opacity", 0);
                       svg.selectAll("circle").transition().duration(150).style("opacity", 0);
                     });

  // 圖例
  const legend = svg.append("g").attr("transform", `translate(10, ${height - margin.bottom})`);
  banks.concat(["總資產"]).forEach((bank, i) => {
    const g = legend.append("g")
                    .attr("transform", `translate(${i * 100}, 0)`);
    g.append("rect")
     .attr("width", 12)
     .attr("height", 12)
     .attr("fill", bankColors[bank]);
    g.append("text")
     .attr("x", 16)
     .attr("y", 10)
     .text(bank)
     .attr("font-size", 12)
     .attr("fill", "var(--color-text)");
  });
}

// 監聽 filteredData 與 resize
const resizeObserver = new ResizeObserver(() => drawChart(filteredData.value));

// 監聽切換區間時重畫
watch(filteredData, (val) => {
  nextTick(() => drawChart(val));
}, { immediate: true });

// Resize + 初始繪圖
onMounted(() => {
  nextTick(() => drawChart(filteredData.value));
  resizeObserver.observe(chartContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style scoped></style>
