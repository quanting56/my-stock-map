<template>
  <div
    ref="containerRef"
    class="relative h-full w-full"
  >
    <svg
      v-if="containerSize.width > 0 && containerSize.height > LEGEND_HEIGHT"
      :viewBox="`0 0 ${containerSize.width} ${containerSize.height}`"
      role="img"
      :aria-label="props.chartAriaLabel"
      class="block h-full w-full"
    >
      <defs>
        <clipPath
          v-for="node in layoutNodes"
          :id="getClipPathId(node.data.rank)"
          :key="`clip-${node.data.id}`"
        >
          <rect
            :x="node.x0"
            :y="node.y0"
            :width="node.x1 - node.x0"
            :height="node.y1 - node.y0"
            rx="4"
            ry="4"
          ></rect>
        </clipPath>
      </defs>

      <!-- Treemap -->
      <template v-if="layoutNodes.length">
        <g
          v-for="node in layoutNodes"
          :key="node.data.id"
        >
          <rect
            :x="node.x0"
            :y="node.y0"
            :width="node.x1 - node.x0"
            :height="node.y1 - node.y0"
            :fill="getChartColor(getBucketIndex(node.data.rank))"
            fill-opacity="0.9"
            rx="4"
            ry="4"
            class="cursor-pointer stroke-border"
            @mousemove="showTooltip($event, node.data)"
            @mouseleave="hideTooltip"
          ></rect>

          <!-- 公司名稱 -->
          <text
            v-if="node.data.rank <= props.labelMaxRank"
            :x="node.x0 + 5"
            :y="node.y0 + 18"
            :clip-path="`url(#${getClipPathId(node.data.rank)})`"
            class="pointer-events-none fill-background text-base font-bold"
          >
            {{ node.data.label }}
          </text>

          <!-- 數值 -->
          <text
            v-if="node.data.rank <= props.valueLabelMaxRank"
            :x="node.x0 + 5"
            :y="node.y0 + 35"
            :clip-path="`url(#${getClipPathId(node.data.rank)})`"
            class="pointer-events-none fill-background text-[11px] opacity-70"
          >
            {{ node.data.displayValue }}
          </text>
        </g>
      </template>

      <!-- Empty state -->
      <text
        v-else
        :x="containerSize.width / 2"
        :y="chartHeight / 2"
        text-anchor="middle"
        class="fill-foreground-muted text-sm"
      >
        {{ props.emptyText }}
      </text>

      <!-- Legend -->
      <g :transform="`translate(5, ${containerSize.height - 25})`">
        <g
          v-for="(legendItem, index) in legendItems"
          :key="legendItem.bucketIndex"
          :transform="`translate(${index * 120}, 0)`"
        >
          <rect
            width="14"
            height="14"
            rx="3"
            :fill="getChartColor(legendItem.bucketIndex)"
          ></rect>

          <text
            x="20"
            y="11"
            class="fill-brand text-sm font-bold"
          >
            {{ legendItem.label }}
          </text>
        </g>
      </g>
    </svg>

    <!-- Tooltip -->
    <div
      v-if="tooltipItem"
      class="pointer-events-none absolute z-50 min-w-32 rounded-md border border-border bg-surface p-2 text-sm text-foreground shadow-lg"
      :style="{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }"
    >
      <div>
        <strong>{{ tooltipItem.label }}</strong>

        <span
          v-if="tooltipItem.secondaryLabel"
          class="ml-1 text-xs text-foreground-muted"
        >
          {{ tooltipItem.secondaryLabel }}
        </span>
      </div>

      <div class="mt-1">排名第 {{ tooltipItem.rank }} 名</div>

      <div>
        {{ tooltipItem.displayValue }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import * as d3 from "d3";

interface TreemapChartItem {
  id: string;
  label: string;
  secondaryLabel?: string;
  value: number;
  displayValue: string;
}

interface TreemapDatum extends TreemapChartItem {
  rank: number;
  children?: TreemapDatum[];
}

interface ContainerSize {
  width: number;
  height: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

interface LegendItem {
  bucketIndex: number;
  label: string;
}

const CHART_COLOR_COUNT = 12;
const LEGEND_HEIGHT = 40;

const props = withDefaults(
  defineProps<{
    items: readonly TreemapChartItem[];
    chartAriaLabel: string;
    emptyText?: string;
    bucketSize?: number;
    maxVisibleBuckets?: number;
    labelMaxRank?: number;
    valueLabelMaxRank?: number;
  }>(),
  {
    emptyText: "暫無資料",
    bucketSize: 50,
    maxVisibleBuckets: 4,
    labelMaxRank: 60,
    valueLabelMaxRank: 50,
  },
);

const containerRef = ref<HTMLDivElement | null>(null);

const containerSize = ref<ContainerSize>({ width: 0, height: 0 });

const tooltipItem = ref<TreemapDatum | null>(null);

const tooltipPosition = ref<TooltipPosition>({ x: 0, y: 0 });

let resizeObserver: ResizeObserver | null = null;

const validItems = computed(() =>
  [...props.items]
    .filter((item) => Number.isFinite(item.value) && item.value > 0)
    .sort((a, b) => b.value - a.value),
);

const rankedItems = computed<TreemapDatum[]>(() =>
  validItems.value.map((item, index) => ({
    ...item,
    rank: index + 1,
  })),
);

const chartHeight = computed(() => Math.max(0, containerSize.value.height - LEGEND_HEIGHT));

const layoutNodes = computed<d3.HierarchyRectangularNode<TreemapDatum>[]>(() => {
  const width = containerSize.value.width;
  const height = chartHeight.value;

  if (width <= 0 || height <= 0 || rankedItems.value.length === 0) {
    return [];
  }

  const rootData: TreemapDatum = {
    id: "__root__",
    label: "",
    value: 0,
    displayValue: "",
    rank: 0,
    children: rankedItems.value,
  };

  const hierarchyRoot = d3
    .hierarchy<TreemapDatum>(rootData)
    .sum((datum) => datum.value)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const treemapRoot = d3
    .treemap<TreemapDatum>()
    .tile(d3.treemapBinary)
    .size([width, height])
    .padding(1)(hierarchyRoot);

  return treemapRoot.leaves();
});

const legendItems = computed<LegendItem[]>(() => {
  if (rankedItems.value.length === 0) {
    return [];
  }

  const bucketCount = Math.ceil(rankedItems.value.length / props.bucketSize);
  const visibleBucketCount = Math.min(bucketCount, props.maxVisibleBuckets);

  return Array.from({ length: visibleBucketCount }, (_, bucketIndex) => ({
    bucketIndex,
    label: `${bucketIndex * props.bucketSize + 1} - ${Math.min(
      (bucketIndex + 1) * props.bucketSize,
      rankedItems.value.length,
    )} 名`,
  }));
});

function getChartColor(index: number): string {
  const colorIndex = (index % CHART_COLOR_COUNT) + 1;

  return `var(--color-chart-${colorIndex})`;
}

function getBucketIndex(rank: number): number {
  return Math.floor((rank - 1) / props.bucketSize);
}

function getClipPathId(rank: number): string {
  return `treemap-clip-${rank}`;
}

function showTooltip(event: MouseEvent, item: TreemapDatum): void {
  const containerElement = containerRef.value;

  if (!containerElement) {
    return;
  }

  const containerRect = containerElement.getBoundingClientRect();

  tooltipItem.value = item;

  tooltipPosition.value = {
    x: event.clientX - containerRect.left + 10,
    y: event.clientY - containerRect.top + 10,
  };
}

function hideTooltip(): void {
  tooltipItem.value = null;
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

<style scoped></style>
