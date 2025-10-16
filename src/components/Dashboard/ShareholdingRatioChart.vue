<template>
  <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4">
    <h3 class="font-medium text-[color:var(--color-secondary)] mb-2">持股分布</h3>

    <div ref="container" class="flex items-center gap-4 relative flex-col xl:flex-row">
      <!-- SVG for donut chart -->
      <div class="h-40 w-40 flex items-center justify-center">
        <svg ref="svgRef" class="w-full h-full"></svg>
      </div>

      <!-- legend -->
      <div class="flex-1">
        <ul class="space-y-2 text-sm">
          <li
            v-for="(d, i) in chartData"
            :key="d.id"
            @click="toggleHighlight(d.id)"
            class="flex items-center justify-between cursor-pointer"
          >
            <div class="flex items-center gap-3">
              <span
                class="w-3 h-3 rounded-sm"
                :style="{ backgroundColor: colorForLegend(i) }"
              ></span>
              <div>
                <div class="font-medium">{{ d.name }}</div>
                <div class="text-xs text-[color:var(--color-secondary)]">{{ d.id }}</div>
              </div>
            </div>
            <div class="text-right pl-3">
              <div class="font-medium text-[color:var(--color-primary)]">
                {{ percentage(d.stockValue) }}%
              </div>
              <div class="text-xs text-[color:var(--color-secondary)]">
                {{ isTotalValueHidden ? "$ ＊＊＊" : "$" + formatNumber(d.stockValue) }}
              </div>
            </div>
          </li>
        </ul>
      </div>

      <!-- tooltip -->
      <div
        ref="tooltip"
        class="bg-[color:var(--color-card)] border border-[color:var(--color-border)] py-2 px-2.5 rounded-md shadow-lg z-50 min-w-24 hidden absolute pointer-events-none text-sm"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from "vue";
import * as d3 from "d3";
import { usePortfolioStore } from "@/store/portfolio";

const props = defineProps({
  isTotalValueHidden: {
    type: Boolean,
    default: false
  }
});

const portfolioStore = usePortfolioStore();

const container = ref(null);
const svgRef = ref(null);
const tooltip = ref(null);

// 當前被 highlight 的 id
const highlighted = ref(null);


// 將 store 的資料轉成圖表要的格式
const details = computed(() => {
  return portfolioStore.holdingDetailsData
    .map((d) => ({
      id: d.id,
      name: d.name,
      stockValue: Number(d.stockValue ?? (d.shares * d.price) ?? 0)
    }))
    .filter((d) => d.id !== null);  // 過濾掉「現金」
});

// 過濾掉值為 0 的項目並依 stockValue 降冪排序（for視覺上好看）
const chartData = computed(() =>
  details.value
    .filter(d => Number(d.stockValue) > 0)
    .sort((a, b) => b.stockValue - a.stockValue)
);

// 用 chartData 計算出 total stockValue
const totalValue = computed(() => chartData.value.reduce((s, d) => s + d.stockValue, 0));

// formatting helpers
const formatNumber = (n) => new Intl.NumberFormat().format(Math.round(n));  // 數字格式化（千分位、四捨五入）
const percentage = (v) => (totalValue.value ? (v / totalValue.value * 100).toFixed(2) : "0.00");


// 顏色處理 ---------

// 圖例顏色
function colorForLegend(i) {
  const palette = d3.schemeTableau10;
  return palette[i % palette.length];
};

// D3 繪圖 ---------

// 繪製 donut 圖
function drawChart() {
  if (!svgRef.value || !container.value) return;

  const data = chartData.value;
  const rect = container.value.getBoundingClientRect();
  const size = Math.min(160, rect.width * 0.48); // keep svg reasonable
  const width = size;
  const height = size;
  const radius = Math.min(width, height) / 2;

  // clear svg
  const svg = d3.select(svgRef.value);
  svg.selectAll("*").remove();

  svg.attr("viewBox", `0 0 ${width} ${height}`)
     .attr("preserveAspectRatio", "xMidYMid meet");

  const g = svg.append("g").attr("transform", `translate(${width/2}, ${height/2})`);

  if (!data.length) {
    g.append("text")
     .attr("text-anchor", "middle")
     .attr("dy", "0.35em")
     .text("No data")
     .style("fill", "var(--color-secondary)");
    return;
  };

  const pie = d3.pie().sort(null).value(d => d.stockValue);
  const arcs = pie(data);  // 計算各弧的角度資料陣列

  const outer = radius * 0.95;
  const inner = radius * 0.58;
  const arcGenerator = d3.arc()
                         .innerRadius(inner)
                         .outerRadius(outer)
                         .cornerRadius(4);

  // 顏色比例尺
  const ids = data.map(d => d.id);
  const colorScale = d3.scaleOrdinal()
                       .domain(ids)
                       .range(d3.schemeTableau10);

  // draw slices
  const paths = g.selectAll("path")
    .data(arcs)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", d =>
      d3.color(colorScale(d.data.id))
        .copy({opacity: highlighted.value && highlighted.value !== d.data.id ? 0.45 : 1})
    )
    .attr("stroke", "var(--color-card)")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on("mousemove", (e, d) => {
      showTooltip(e, d);
      d3.select(e.currentTarget).attr("opacity", 0.9);
    })
    .on("mouseout", (e) => {
      hideTooltip();
      d3.select(e.currentTarget).attr("opacity", 1);
    })
    .on("click", (e, d) => {
      // toggle highlight
      highlighted.value = highlighted.value === d.data.id ? null : d.data.id;
      // redraw to reflect highlight
      drawChart();
    });

  // center texts
  g.append("text")
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("fill", "var(--color-secondary)")
    .text("持倉");

  g.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.6em")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "var(--color-primary)")
    .text(
      props.isTotalValueHidden
        ? "＊＊＊"
        : `$${formatNumber(totalValue.value)}`
    );
};

// tooltip helpers
function showTooltip(e, d) {
  if (!tooltip.value) return;
  const t = tooltip.value;
  const [x, y] = d3.pointer(e, container.value);
  t.style.left = `${x + 18}px`;
  t.style.top = `${y + 18}px`;
  t.innerHTML = `
    <div class="font-semibold">${d.data.name}</div>
    <div class="text-[13px] mt-1">${formatNumber(d.data.stockValue)} 元</div>
    <div class="text-[12px] text-[color:var(--color-secondary)] mt-0.5">${((d.data.stockValue/totalValue.value)*100).toFixed(2)}%</div>
  `;
  t.classList.remove('hidden');
}

function hideTooltip() {
  if (!tooltip.value) return;
  tooltip.value.classList.add('hidden');
}

// 從 legend 點擊切換 highlight ，同時重新繪製
function toggleHighlight(id) {
  highlighted.value = highlighted.value === id ? null : id;
  drawChart();
}

// reactive watchers
let resizeObserver = null;
let stopWatch = null;

onMounted(() => {
  // 元件掛載完成後首次繪製
  nextTick(() => {
    drawChart();
  });

  // 當 chartData 或 totalValue 改變時，圖形重繪
  stopWatch = watch(
    [
      chartData,
      () => totalValue.value,
      () => props.isTotalValueHidden
    ],
    () => { drawChart(); }
  );

  // 容器尺寸變化時重繪
  if (container.value && window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      drawChart();
    });
    resizeObserver.observe(container.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();  // 離開元件時解除 observer
  if (stopWatch) stopWatch();  // 移除 stopWatch()
});
</script>

<style scoped></style>
