<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow lg:col-span-1">
    <h3 class="mb-2 font-medium text-foreground-muted">持股分布（個股 + ETF）</h3>

    <div
      ref="containerRef"
      class="relative flex flex-col items-center gap-4 xl:flex-row"
    >
      <!-- Donut chart -->
      <div class="flex h-40 w-40 items-center justify-center">
        <svg
          ref="svgRef"
          role="img"
          aria-label="持股分布圓環圖"
          class="h-full w-full"
        ></svg>
      </div>

      <!-- Legend -->
      <div class="flex-1">
        <ul class="space-y-2 text-sm">
          <li
            v-for="(item, index) in chartData"
            :key="item.id"
          >
            <button
              type="button"
              :aria-pressed="highlightedId === item.id"
              class="flex w-full cursor-pointer items-center justify-between rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              @click="toggleHighlightedId(item.id)"
            >
              <div class="flex items-center gap-3">
                <span
                  class="h-3 w-3 shrink-0 rounded-sm"
                  :style="{ backgroundColor: getChartColor(index) }"
                ></span>

                <div>
                  <div class="font-medium">{{ item.name }}</div>
                  <div class="text-xs text-foreground-muted">{{ item.id }}</div>
                </div>
              </div>

              <div class="pl-3 text-right">
                <div class="font-medium text-brand">
                  {{ formatPercentage(getHoldingRatio(item.stockValue)) }}
                </div>

                <div class="text-xs text-foreground-muted">
                  {{ props.isTotalValueHidden ? "$ ＊＊＊" : `$${formatAmount(item.stockValue)}` }}
                </div>
              </div>
            </button>
          </li>
        </ul>
      </div>

      <!-- Tooltip -->
      <div
        ref="tooltipRef"
        class="pointer-events-none absolute z-50 hidden min-w-24 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground shadow-lg"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

import { formatAmount, formatPercentage } from "@/utils/format/number";
import { usePortfolioStore } from "@/stores/portfolio";

interface HoldingChartDatum {
  id: string;
  name: string;
  stockValue: number;
}

const CHART_COLOR_COUNT = 12;

const props = withDefaults(
  defineProps<{
    isTotalValueHidden?: boolean;
  }>(),
  {
    isTotalValueHidden: false,
  },
);

const portfolioStore = usePortfolioStore();

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);
const tooltipRef = ref<HTMLDivElement | null>(null);

/** 目前高亮顯示的持股 id。 */
const highlightedId = ref<string | null>(null);

let resizeObserver: ResizeObserver | null = null;

// 將 store 的資料轉成圖表要的格式
const chartData = computed<HoldingChartDatum[]>(() => {
  return portfolioStore.holdingDetailsData
    .filter((holding) => holding.stockValue > 0)
    .map((holding) => ({
      id: holding.id,
      name: holding.name,
      stockValue: holding.stockValue,
    }))
    .sort((a, b) => b.stockValue - a.stockValue);
});

const totalValue = computed(() => d3.sum(chartData.value, (item) => item.stockValue));

function getHoldingRatio(stockValue: number): number {
  return totalValue.value ? stockValue / totalValue.value : 0;
}

function getSliceOpacity(id: string): number {
  if (highlightedId.value === null || highlightedId.value === id) {
    return 1;
  }

  return 0.45;
}

function toggleHighlightedId(id: string): void {
  highlightedId.value = highlightedId.value === id ? null : id;
}

// ===============
// 顏色處理
// ===============

function getChartColor(index: number): string {
  const colorIndex = (index % CHART_COLOR_COUNT) + 1;

  return `var(--color-chart-${colorIndex})`;
}

// ===============
// D3 繪圖
// ===============

// 繪製 donut 圖
function renderChart(): void {
  const containerElement = containerRef.value;
  const svgElement = svgRef.value;

  if (!containerElement || !svgElement) {
    return;
  }

  hideTooltip();

  const data = chartData.value;
  const containerRect = containerElement.getBoundingClientRect();

  const size = Math.min(160, containerRect.width * 0.48);
  const width = size;
  const height = size;
  const radius = Math.min(width, height) / 2;

  const svg = d3.select<SVGSVGElement, unknown>(svgElement);

  svg.selectAll("*").remove(); // clear svg

  svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

  const chartGroup = svg.append("g").attr("transform", `translate(${width / 2}, ${height / 2})`);

  if (!data.length) {
    chartGroup
      .append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("fill", "var(--color-foreground-muted)")
      .text("暫無資料");

    return;
  }

  const pieGenerator = d3
    .pie<HoldingChartDatum>()
    .sort(null)
    .value((item) => item.stockValue);

  const arcs = pieGenerator(data); // 計算各弧的角度資料陣列

  const outerRadius = radius * 0.95;
  const innerRadius = radius * 0.58;

  const arcGenerator = d3
    .arc<d3.PieArcDatum<HoldingChartDatum>>()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius)
    .cornerRadius(4);

  chartGroup
    .selectAll<SVGPathElement, d3.PieArcDatum<HoldingChartDatum>>("path")
    .data(arcs)
    .join("path")
    .attr("d", arcGenerator)
    .attr("fill", (_arcDatum, index) => getChartColor(index))
    .attr("opacity", (arcDatum) => getSliceOpacity(arcDatum.data.id))
    .attr("stroke", "var(--color-surface)")
    .attr("stroke-width", 1)
    .style("cursor", "pointer")
    .on(
      "mousemove",
      function (
        this: SVGPathElement,
        event: MouseEvent,
        arcDatum: d3.PieArcDatum<HoldingChartDatum>,
      ) {
        showTooltip(event, arcDatum);

        d3.select(this).attr("opacity", 0.9);
      },
    )
    .on(
      "mouseout",
      function (
        this: SVGPathElement,
        _event: MouseEvent,
        arcDatum: d3.PieArcDatum<HoldingChartDatum>,
      ) {
        hideTooltip();

        d3.select(this).attr("opacity", getSliceOpacity(arcDatum.data.id));
      },
    )
    .on("click", (_event: MouseEvent, arcDatum: d3.PieArcDatum<HoldingChartDatum>) => {
      toggleHighlightedId(arcDatum.data.id);
    });

  // 中心文字
  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("fill", "var(--color-foreground-muted)")
    .text("持倉");

  chartGroup
    .append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "1.6em")
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("fill", "var(--color-brand)")
    .text(props.isTotalValueHidden ? "＊＊＊" : `$${formatAmount(totalValue.value)}`);
}

// ===============
// Tooltip
// ===============

function showTooltip(event: MouseEvent, arcDatum: d3.PieArcDatum<HoldingChartDatum>): void {
  const containerElement = containerRef.value;
  const tooltipElement = tooltipRef.value;

  if (!containerElement || !tooltipElement) {
    return;
  }

  const [x, y] = d3.pointer(event, containerElement);

  tooltipElement.style.left = `${x + 18}px`;
  tooltipElement.style.top = `${y + 18}px`;

  const amountText = props.isTotalValueHidden
    ? "＊＊＊"
    : `${formatAmount(arcDatum.data.stockValue)} 元`;

  tooltipElement.innerHTML = `
    <div class="font-semibold">${arcDatum.data.name}</div>
    <div class="mt-1 text-[13px]">${amountText}</div>
    <div class="mt-0.5 text-xs text-foreground-muted">
      ${formatPercentage(getHoldingRatio(arcDatum.data.stockValue))}
    </div>
  `;

  tooltipElement.classList.remove("hidden");
}

function hideTooltip(): void {
  tooltipRef.value?.classList.add("hidden");
}

// 相關顯示狀態改變時重新繪製圖表
watch(
  [chartData, () => props.isTotalValueHidden, highlightedId],
  () => {
    renderChart();
  },
  {
    flush: "post",
  },
);

onMounted(() => {
  renderChart();

  // 容器尺寸變化時重繪
  if (containerRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(() => {
      renderChart();
    });

    resizeObserver.observe(containerRef.value);
  }
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect(); // 離開元件時解除 observer
});
</script>

<style scoped></style>
