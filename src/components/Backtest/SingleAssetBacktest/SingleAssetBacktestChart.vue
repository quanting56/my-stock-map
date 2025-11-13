<template>
  <div class="card-theme rounded-2xl shadow p-6 relative">  <!-- 加 relative 才能放 overlay -->
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium">📈 資產變化走勢</h3>
      <button
        @click="kpiOpen = !kpiOpen"
        class="z-20 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 backdrop-blur px-2 py-1 text-xs shadow hover:brightness-105 active:scale-95 transition cursor-pointer"
        :class="kpiOpen ? 'ring ring-amber-300' : ''"
        aria-label="顯示 KPI 摘要"
        title="顯示 KPI 摘要"
      >
        📊 KPI
      </button>
    </div>

    <div
      ref="chartContainerRef"
      class="relative h-72 md:h-96 flex items-center justify-center border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-[color:var(--color-secondary)] opacity-70"
    >
      <svg ref="svgRef" class="w-full h-full"></svg>
      <div
        ref="tooltipRef"
        class="absolute bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)] text-xs px-2 py-1 rounded shadow opacity-0 transition-opacity duration-200 pointer-events-none"
      ></div>
    </div>

    <!-- KPI 面板（圖內右下角） -->
    <div
      v-if="kpiOpen"
      @click="kpiOpen = false"
      class="absolute bottom-16 right-3 active:scale-95 transition cursor-pointer"
      aria-label="回測摘要指標"
    >
      <div class="px-3 py-2 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/85 backdrop-blur shadow-sm">
        <!-- 容器："mobile: flex 橫捲" / "md+: grid 2×2" -->
        <div class="flex gap-2 overflow-x-auto max-w-[80vw] py-1 md:overflow-visible md:max-w-none md:py-0 md:grid md:grid-cols-2 md:gap-2">
          <!-- chip -->
          <div
            v-for="item in items"
            :key="item.key"
            class="shrink-0 md:shrink flex items-center justify-between gap-2 px-2 py-1 rounded-lg border border-[color:var(--color-border)] md:border-0 md:bg-black/5"
          >
            <span class="text-xs text-[color:var(--color-secondary)]">{{ item.label }}</span>
            <span
              class="text-sm font-semibold"
              :class="item.cls"
            >
              {{ item.val }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from "vue";
import * as d3 from "d3";

const props = defineProps({
  series: {  // [{date: Date, equity: number}]
    type: Array,
    default: () => []
  },
  kpis: {
    type: Object,
    default: () => ({
      totalReturn: null,
      maxDrawdown: null,
      cagr: null,
      winRate: null
    })
  }
});

const kpiOpen = ref(false);

const chartContainerRef = ref();
const svgRef = ref();
const tooltipRef = ref(null);
const transitionDuration = 1000;  // 動畫過渡時間

// chip 卡片區域
const pct = (v, d = 1) => v == null ? "—" : `${ v > 0 ? "+" : "" }${(v * 100).toFixed(d)}%`;
const items = computed(() => [
  { key: "tr",  label: "總報酬率", val: pct(props.kpis.totalReturn), cls: props.kpis.totalReturn >= 0 ? "text-[color:var(--color-line2)]" : "text-[color:var(--color-line3)]" },
  { key: "dd",  label: "最大回撤", val: pct(props.kpis.maxDrawdown), cls: props.kpis.maxDrawdown >= 0 ? "text-[color:var(--color-line2)]" : "text-[color:var(--color-line3)]" },
  { key: "cagr",label: "年化報酬", val: pct(props.kpis.cagr),      cls: "text-[color:var(--color-primary)]" },
  { key: "win", label: "勝率",     val: pct(props.kpis.winRate),    cls: "text-[color:var(--color-primary)]" },
]);


// D3 繪圖函式
function drawChart() {
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  const width = chartContainerRef.value.clientWidth;
  const height = chartContainerRef.value.clientHeight;
  const margin = { top: 30, right: 40, bottom: 30, left: 60 };

  const data = (props.series || []).filter(d => Number.isFinite(d.equity));
  if (!data.length){
    svg.append("text")
       .attr("x", width / 2)
       .attr("y", height / 2)
       .attr("text-anchor", "middle")
       .attr("dominant-baseline", "middle")
       .attr("fill", "currentColor")
       .attr("opacity", 0.6)
       .text("無資料");
    return;
  }

  // 設定比例尺
  const xScale = d3.scaleTime()
                   .domain(d3.extent(data, (d) => d.date))
                   .range([margin.left, width - margin.right])
                   .nice();

  const yScale = d3.scaleLinear()
                   .domain(d3.extent(data, (d) => d.equity))
                   .range([height - margin.bottom, margin.top])
                   .nice();

  const line = d3.line()
                 .x((d) => xScale(d.date))
                 .y((d) => yScale(d.equity))
                 .defined((d) => Number.isFinite(d.equity))
                 .curve(d3.curveMonotoneX);

  // 動態設定線段顏色
  const lineColor = props.series.at(-1).equity >= props.series[0].equity
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
                                 .attr("y1", yScale(d.equity))
                                 .attr("y2", yScale(d.equity));

                       dot.transition()
                          .duration(80)
                          .attr("cx", xScale(d.date))
                          .attr("cy", yScale(d.equity))
                          .style("opacity", 1);

                       // tooltip ，使用防溢出邏輯
                       const tipWidth = 160;
                       const tipHeight = 70;
                       let tipX = xScale(d.date) + 30;   // 預設顯示在右上角
                       let tipY = yScale(d.equity) - tipHeight - 10;
                       if (tipX + tipWidth > width) tipX = xScale(d.date) - tipWidth + 40;
                       if (tipY < 0) tipY = yScale(d.equity) + 10;

                       tip.html(`
                            <div><strong>${d3.timeFormat("%Y/%m/%d")(d.date)}</strong></div>
                            <div>此時資產: $${Number(d.equity.toFixed(0)).toLocaleString()}</div>
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
}


// 由尺寸 tick 觸發同一個 watch，避免與 filteredData 各畫一次
const resizeTick = ref(0);
const resizeObserver = new ResizeObserver(() => { resizeTick.value++; });

// 資料變更 或 尺寸變更，圖形只畫一次
watch([props, resizeTick], ([val]) => {
  if (!val || val.length < 2) return;  // 避免空畫面與單點重畫
  nextTick(() => drawChart(val));
}, { immediate: true });

onMounted(() => {
  drawChart();
  resizeObserver.observe(chartContainerRef.value);
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
});
</script>

<style scoped></style>
