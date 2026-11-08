<template>
  <div
    ref="containerRef"
    class="relative flex flex-col items-center gap-4 xl:flex-row"
  >
    <!-- Donut -->
    <div class="flex h-40 w-40 shrink-0 items-center justify-center">
      <svg
        :viewBox="`0 0 ${CHART_SIZE} ${CHART_SIZE}`"
        role="img"
        :aria-label="props.chartAriaLabel"
        class="h-full w-full"
      >
        <g :transform="`translate(${CHART_SIZE / 2}, ${CHART_SIZE / 2})`">
          <template v-if="arcs.length">
            <path
              v-for="(arcDatum, index) in arcs"
              :key="arcDatum.data.id"
              :d="getArcPath(arcDatum)"
              :fill="getChartColor(index)"
              :opacity="getSliceOpacity(arcDatum.data.id)"
              stroke-width="1"
              class="cursor-pointer stroke-surface transition-opacity"
              @mousemove="showTooltip($event, arcDatum.data)"
              @mouseleave="hideTooltip"
              @click="toggleHighlightedId(arcDatum.data.id)"
            ></path>

            <text
              text-anchor="middle"
              class="fill-foreground-muted text-[22px]"
            >
              {{ props.centerLabel }}
            </text>

            <text
              text-anchor="middle"
              dy="1.6em"
              class="fill-brand text-xs font-bold"
            >
              {{ props.centerValue }}
            </text>
          </template>

          <text
            v-else
            text-anchor="middle"
            dy="0.35em"
            class="fill-foreground-muted text-sm"
          >
            {{ props.emptyText }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Legend -->
    <div class="min-w-0 flex-1">
      <ul class="space-y-2 text-sm">
        <li
          v-for="(item, index) in validItems"
          :key="item.id"
        >
          <button
            type="button"
            :aria-pressed="highlightedId === item.id"
            class="flex w-full cursor-pointer items-center justify-between rounded-md text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            @click="toggleHighlightedId(item.id)"
          >
            <div class="flex min-w-0 items-center gap-3">
              <span
                class="h-3 w-3 shrink-0 rounded-sm"
                :style="{ backgroundColor: getChartColor(index) }"
                aria-hidden="true"
              ></span>

              <div class="min-w-0">
                <div class="font-medium">{{ item.label }}</div>
                <div
                  v-if="item.secondaryLabel"
                  class="text-xs text-foreground-muted"
                >
                  {{ item.secondaryLabel }}
                </div>
              </div>
            </div>

            <div class="shrink-0 pl-3 text-right">
              <div class="font-medium text-brand">
                {{ formatPercentage(getItemRatio(item.value)) }}
              </div>

              <div class="text-xs text-foreground-muted">
                {{ item.displayValue }}
              </div>
            </div>
          </button>
        </li>
      </ul>
    </div>

    <!-- Tooltip -->
    <div
      v-if="tooltipItem"
      class="pointer-events-none absolute z-50 min-w-24 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground shadow-lg"
      :style="{
        left: `${tooltipPosition.x}px`,
        top: `${tooltipPosition.y}px`,
      }"
    >
      <div class="font-semibold">
        {{ tooltipItem.label }}
      </div>

      <div class="text-xs">
        {{ tooltipItem.displayValue }}
      </div>

      <div class="text-xs text-foreground-muted">
        {{ formatPercentage(getItemRatio(tooltipItem.value)) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import * as d3 from "d3";

import { formatPercentage } from "@/utils/format/number";

interface DonutChartItem {
  id: string;
  label: string;
  secondaryLabel?: string;
  value: number;
  displayValue: string;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const CHART_SIZE = 160;
const CHART_COLOR_COUNT = 12;

const props = withDefaults(
  defineProps<{
    items: readonly DonutChartItem[];
    chartAriaLabel: string;
    centerLabel: string;
    centerValue: string;
    emptyText?: string;
  }>(),
  {
    emptyText: "暫無資料",
  },
);

const containerRef = ref<HTMLDivElement | null>(null);

const highlightedId = ref<string | null>(null);
const hoveredId = ref<string | null>(null);

const tooltipItem = ref<DonutChartItem | null>(null);
const tooltipPosition = ref<TooltipPosition>({ x: 0, y: 0 });

const validItems = computed(() =>
  props.items.filter((item) => Number.isFinite(item.value) && item.value > 0),
);

const totalValue = computed(() => d3.sum(validItems.value, (item) => item.value));

const pieGenerator = d3
  .pie<DonutChartItem>()
  .sort(null)
  .value((item) => item.value);

const arcs = computed(() => pieGenerator(validItems.value));

const outerRadius = (CHART_SIZE / 2) * 0.95;
const innerRadius = (CHART_SIZE / 2) * 0.58;

const arcGenerator = d3
  .arc<d3.PieArcDatum<DonutChartItem>>()
  .innerRadius(innerRadius)
  .outerRadius(outerRadius)
  .cornerRadius(4);

function getArcPath(arcDatum: d3.PieArcDatum<DonutChartItem>): string {
  return arcGenerator(arcDatum) ?? "";
}

function getItemRatio(value: number): number {
  return totalValue.value ? value / totalValue.value : 0;
}

function getChartColor(index: number): string {
  const colorIndex = (index % CHART_COLOR_COUNT) + 1;

  return `var(--color-chart-${colorIndex})`;
}

function getSliceOpacity(id: string): number {
  if (hoveredId.value === id) {
    return 0.9;
  }

  if (highlightedId.value === null || highlightedId.value === id) {
    return 1;
  }

  return 0.45;
}

function toggleHighlightedId(id: string): void {
  highlightedId.value = highlightedId.value === id ? null : id;
}

function showTooltip(event: MouseEvent, item: DonutChartItem): void {
  const containerElement = containerRef.value;

  if (!containerElement) {
    return;
  }

  const containerRect = containerElement.getBoundingClientRect();

  hoveredId.value = item.id;
  tooltipItem.value = item;

  tooltipPosition.value = {
    x: event.clientX - containerRect.left + 18,
    y: event.clientY - containerRect.top + 18,
  };
}

function hideTooltip(): void {
  hoveredId.value = null;
  tooltipItem.value = null;
}
</script>

<style scoped></style>
