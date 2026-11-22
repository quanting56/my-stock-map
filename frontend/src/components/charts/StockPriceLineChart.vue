<template>
  <div
    ref="containerRef"
    class="relative h-full w-full"
  >
    <svg
      v-if="chartLayout"
      ref="svgRef"
      :viewBox="`0 0 ${chartLayout.width} ${chartLayout.height}`"
      role="img"
      :aria-label="props.chartAriaLabel"
      class="block h-full w-full"
    >
      <!-- X axis -->
      <line
        :x1="MARGIN.left"
        :x2="chartLayout.width - MARGIN.right"
        :y1="chartLayout.plotBottom"
        :y2="chartLayout.plotBottom"
        class="stroke-foreground-muted"
      ></line>

      <g
        v-for="tick in chartLayout.xTicks"
        :key="tick.value"
      >
        <line
          :x1="tick.x"
          :x2="tick.x"
          :y1="chartLayout.plotBottom"
          :y2="chartLayout.plotBottom + 6"
          class="stroke-foreground-muted"
        ></line>

        <text
          :x="tick.x"
          :y="chartLayout.plotBottom + 18"
          text-anchor="middle"
          class="fill-foreground-muted text-[10px]"
        >
          {{ tick.label }}
        </text>
      </g>

      <!-- Y axis -->
      <line
        :x1="MARGIN.left"
        :x2="MARGIN.left"
        :y1="MARGIN.top"
        :y2="chartLayout.plotBottom"
        class="stroke-foreground-muted"
      ></line>

      <g
        v-for="tick in chartLayout.yTicks"
        :key="tick.value"
      >
        <line
          :x1="MARGIN.left - 6"
          :x2="MARGIN.left"
          :y1="tick.y"
          :y2="tick.y"
          class="stroke-foreground-muted"
        ></line>

        <text
          :x="MARGIN.left - 10"
          :y="tick.y + 3"
          text-anchor="end"
          class="fill-foreground-muted text-[10px]"
        >
          {{ tick.label }}
        </text>
      </g>

      <!-- Price line -->
      <path
        v-if="chartLayout.linePath"
        :key="chartLayout.pathKey"
        :d="chartLayout.linePath"
        :stroke="chartLayout.lineColor"
        pathLength="1"
        stroke-width="2"
        class="stock-price-line fill-none"
      ></path>

      <!-- Hover crosshair -->
      <template v-if="hoveredPoint">
        <line
          :x1="hoveredPoint.x"
          :x2="hoveredPoint.x"
          :y1="MARGIN.top"
          :y2="chartLayout.plotBottom"
          class="pointer-events-none stroke-border-strong opacity-60"
        ></line>

        <circle
          :cx="hoveredPoint.x"
          :cy="hoveredPoint.y"
          r="4"
          :fill="chartLayout.lineColor"
          class="pointer-events-none"
        ></circle>
      </template>

      <!-- Pointer interaction layer -->
      <rect
        :x="MARGIN.left"
        :y="MARGIN.top"
        :width="chartLayout.plotWidth"
        :height="chartLayout.plotHeight"
        fill="transparent"
        class="cursor-crosshair"
        @mousemove="handlePointerMove"
        @mouseleave="hideTooltip"
      ></rect>
    </svg>

    <!-- Empty state -->
    <div
      v-else-if="containerSize.width > 0 && containerSize.height > 0"
      class="absolute inset-0 flex items-center justify-center text-sm text-foreground-muted"
    >
      {{ props.emptyText }}
    </div>

    <!--
      TODO:
      下一個 commit 改用 BaseTooltip，這一筆先完成 chart / business separation 與 declarative rendering。
    -->
    <div
      v-if="hoveredDatum"
      class="pointer-events-none absolute z-50 w-40 rounded-md border border-border bg-surface px-2.5 py-2 text-xs text-foreground shadow-lg"
      :style="{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }"
    >
      <div class="font-semibold">
        {{ formatChartDate(hoveredDatum.date) }}
      </div>

      <div class="mt-1">高價：{{ formatPrice(hoveredDatum.high) }}</div>
      <div>低價：{{ formatPrice(hoveredDatum.low) }}</div>
      <div>平盤：{{ previousClose !== null ? formatPrice(previousClose) : "—" }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import * as d3 from "d3";

import { formatPrice } from "@/utils/format/number";

interface StockPricePoint {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ContainerSize {
  width: number;
  height: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const MARGIN = {
  top: 16,
  right: 28,
  bottom: 20,
  left: 40,
} as const;

const TOOLTIP_WIDTH = 160;
const TOOLTIP_HEIGHT = 76;
const TOOLTIP_OFFSET = 12;

const props = withDefaults(
  defineProps<{
    data: readonly StockPricePoint[];
    chartAriaLabel: string;
    emptyText?: string;
  }>(),
  {
    emptyText: "暫無股價資料",
  },
);

const containerRef = ref<HTMLDivElement | null>(null);
const svgRef = ref<SVGSVGElement | null>(null);

const containerSize = ref<ContainerSize>({ width: 0, height: 0 });

const hoveredDatum = ref<StockPricePoint | null>(null);
const previousClose = ref<number | null>(null);

const tooltipPosition = ref<TooltipPosition>({ x: 0, y: 0 });

let resizeObserver: ResizeObserver | null = null;

const formatChartDate = d3.timeFormat("%Y/%m/%d");

const axisPriceFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  maximumFractionDigits: 2,
});

const chartData = computed<StockPricePoint[]>(() =>
  [...props.data]
    .filter(
      (datum) =>
        !Number.isNaN(datum.date.getTime())
        && Number.isFinite(datum.open)
        && Number.isFinite(datum.high)
        && Number.isFinite(datum.low)
        && Number.isFinite(datum.close),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime()),
);

const chartLayout = computed(() => {
  const width = containerSize.value.width;
  const height = containerSize.value.height;
  const data = chartData.value;

  if (width <= MARGIN.left + MARGIN.right || height <= MARGIN.top + MARGIN.bottom) {
    return null;
  }

  const firstDatum = data[0];
  const lastDatum = data.at(-1);

  if (!firstDatum || !lastDatum || data.length < 2) {
    return null;
  }

  const minPrice = d3.min(data, (datum) => datum.low);
  const maxPrice = d3.max(data, (datum) => datum.high);

  if (minPrice === undefined || maxPrice === undefined) {
    return null;
  }

  const plotBottom = height - MARGIN.bottom;
  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = plotBottom - MARGIN.top;

  const xScale = d3
    .scaleTime()
    .domain([firstDatum.date, lastDatum.date])
    .range([MARGIN.left, width - MARGIN.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([minPrice, maxPrice])
    .range([plotBottom, MARGIN.top])
    .nice();

  const lineGenerator = d3
    .line<StockPricePoint>()
    .x((datum) => xScale(datum.date))
    .y((datum) => yScale(datum.close))
    .curve(d3.curveMonotoneX);

  const linePath = lineGenerator(data) ?? "";

  const lineColor = lastDatum.close >= firstDatum.open ? "var(--color-gain)" : "var(--color-loss)";

  const xTicks = xScale.ticks(5).map((date) => ({
    value: date.getTime(),
    x: xScale(date),
    label: formatChartDate(date),
  }));

  const yTicks = yScale.ticks(5).map((value) => ({
    value,
    y: yScale(value),
    label: axisPriceFormatter.format(value),
  }));

  return {
    width,
    height,
    plotBottom,
    plotWidth,
    plotHeight,
    xScale,
    yScale,
    xTicks,
    yTicks,
    linePath,
    lineColor,
    pathKey: `${firstDatum.date.getTime()}-${lastDatum.date.getTime()}-${data.length}-${lastDatum.close}`,
  };
});

const hoveredPoint = computed(() => {
  const layout = chartLayout.value;
  const datum = hoveredDatum.value;

  if (!layout || !datum) {
    return null;
  }

  return {
    x: layout.xScale(datum.date),
    y: layout.yScale(datum.close),
  };
});

const dateBisector = d3.bisector<StockPricePoint, number>((datum) => datum.date.getTime());

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function handlePointerMove(event: MouseEvent): void {
  const layout = chartLayout.value;
  const svgElement = svgRef.value;
  const data = chartData.value;

  if (!layout || !svgElement || data.length === 0) {
    return;
  }

  const [pointerX] = d3.pointer(event, svgElement);

  const clampedPointerX = clamp(pointerX, MARGIN.left, layout.width - MARGIN.right);

  const pointerDate = layout.xScale.invert(clampedPointerX);

  const datumIndex = dateBisector.center(data, pointerDate.getTime());

  const datum = data[datumIndex];

  if (!datum) {
    return;
  }

  const datumX = layout.xScale(datum.date);
  const datumY = layout.yScale(datum.close);

  hoveredDatum.value = datum;
  previousClose.value = datumIndex > 0 ? (data[datumIndex - 1]?.close ?? null) : null;

  let tooltipX = datumX + TOOLTIP_OFFSET;
  let tooltipY = datumY - TOOLTIP_HEIGHT - TOOLTIP_OFFSET;

  if (tooltipX + TOOLTIP_WIDTH > layout.width) {
    tooltipX = datumX - TOOLTIP_WIDTH - TOOLTIP_OFFSET;
  }

  if (tooltipY < 0) {
    tooltipY = datumY + TOOLTIP_OFFSET;
  }

  tooltipPosition.value = {
    x: clamp(tooltipX, 0, Math.max(0, layout.width - TOOLTIP_WIDTH)),
    y: clamp(tooltipY, 0, Math.max(0, layout.height - TOOLTIP_HEIGHT)),
  };
}

function hideTooltip(): void {
  hoveredDatum.value = null;
  previousClose.value = null;
}

function updateContainerSize(): void {
  const containerElement = containerRef.value;

  if (!containerElement) {
    return;
  }

  containerSize.value = {
    width: containerElement.clientWidth,
    height: containerElement.clientHeight,
  };
}

watch(
  () => props.data,
  () => {
    hideTooltip();
  },
);

onMounted(() => {
  updateContainerSize();

  const containerElement = containerRef.value;

  if (!containerElement || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    hideTooltip();
    updateContainerSize();
  });

  resizeObserver.observe(containerElement);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.stock-price-line {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: stock-price-line-draw 1s cubic-bezier(0.33, 1, 0.68, 1) forwards;
}

@keyframes stock-price-line-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .stock-price-line {
    animation: none;
    stroke-dashoffset: 0;
  }
}
</style>
