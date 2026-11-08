<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-medium text-foreground-muted">大盤市值佔比</h3>

      <div class="text-xs text-foreground-muted">
        資料最後更新時間：{{ displayDate || "載入中..." }}
      </div>
    </div>

    <div
      ref="chartContainerRef"
      class="relative h-108 w-full"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import * as d3 from "d3";

import { formatPercentage } from "@/utils/format/number";
import { fetchMarketTreemapData, type MarketTreemapData } from "@/api/stocksApi";
// mock data（備援資料）
import { mockData } from "@/data/mock/marketCapitalizationTreemapData";

interface TreemapDatum {
  id: string;
  name: string;
  marketCapRatio: number;
  rank: number;
  children?: TreemapDatum[];
}

const BUCKET_SIZE = 50; // 照公司「市值占大盤比重」排名每 50 個一組
const MAX_VISIBLE_BUCKETS = 4;
const COMPANY_LABEL_MAX_RANK = 60;
const RATIO_LABEL_MAX_RANK = 50;
const CHART_COLOR_COUNT = 12;
const LEGEND_HEIGHT = 40;

const treemapData = ref<MarketTreemapData | null>(null);

const chartContainerRef = ref<HTMLDivElement | null>(null);

let resizeObserver: ResizeObserver | null = null;

const displayDate = computed(() => treemapData.value?.date ?? "");

function getChartColor(index: number): string {
  const colorIndex = (index % CHART_COLOR_COUNT) + 1;

  return `var(--color-chart-${colorIndex})`;
}

function getBucketIndex(rank: number): number {
  return Math.floor((rank - 1) / BUCKET_SIZE);
}

/** 將 API / mock 資料整理為 D3 Treemap 使用的資料結構。 */
function createTreemapRootData(data: MarketTreemapData): TreemapDatum {
  const children: TreemapDatum[] = [...data.children]
    .filter((item) => Number.isFinite(item.marketCapRatio) && item.marketCapRatio > 0)
    .sort((a, b) => b.marketCapRatio - a.marketCapRatio)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

  return {
    id: data.name,
    name: data.name,
    marketCapRatio: 0,
    rank: 0,
    children,
  };
}

/** 繪製大盤市值 Treemap。 */
function renderTreemap(data: MarketTreemapData): void {
  const containerElement = chartContainerRef.value;

  if (!containerElement) {
    return;
  }

  const width = containerElement.clientWidth;
  const height = containerElement.clientHeight;

  if (width <= 0 || height <= LEGEND_HEIGHT) {
    return;
  }

  d3.select(containerElement).selectAll("*").remove();

  const rootData = createTreemapRootData(data);
  const children = rootData.children ?? [];

  const hierarchyRoot = d3
    .hierarchy<TreemapDatum>(rootData)
    .sum((datum) => datum.marketCapRatio)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const treemapRoot = d3
    .treemap<TreemapDatum>()
    .tile(d3.treemapBinary)
    .size([width, height - LEGEND_HEIGHT])
    .padding(1)(hierarchyRoot);

  const svg = d3
    .select(containerElement)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-label", "臺灣上市公司大盤市值佔比圖")
    .style("display", "block");

  // TODO: 下一階段抽 TreemapChart.vue 時改為 Vue 控制 Tooltip
  const tooltip = d3
    .select(containerElement)
    .append("div")
    .attr(
      "class",
      "pointer-events-none absolute z-50 rounded-md border border-border bg-surface p-2 text-sm text-foreground shadow-lg",
    )
    .style("opacity", 0);

  const leaves = treemapRoot.leaves();

  const leafGroups = svg
    .selectAll<SVGGElement, d3.HierarchyRectangularNode<TreemapDatum>>("g")
    .data(leaves)
    .join("g")
    .attr("transform", (node) => `translate(${node.x0}, ${node.y0})`);

  leafGroups
    .append("rect")
    .attr("id", (node) => `treemap-rect-${node.data.rank}`)
    .attr("fill", (node) => getChartColor(getBucketIndex(node.data.rank)))
    .attr("fill-opacity", 0.9)
    .attr("width", (node) => node.x1 - node.x0)
    .attr("height", (node) => node.y1 - node.y0)
    .attr("stroke", "var(--color-border)")
    .attr("rx", 4)
    .attr("ry", 4)
    .on("mouseover", (_event, node) => {
      tooltip.style("opacity", 1).html(
        `<strong>${node.data.name}</strong> <small>${node.data.id}</small><br>
        排名第 ${node.data.rank} 名<br>
        市值佔比：${formatPercentage(node.data.marketCapRatio, 4)}`,
      );
    })
    .on("mousemove", (event: MouseEvent) => {
      const [x, y] = d3.pointer(event, containerElement);

      tooltip.style("left", `${x + 10}px`).style("top", `${y + 10}px`);
    })
    .on("mouseout", () => {
      tooltip.style("opacity", 0);
    });

  // 建立 clipPath，避免文字超出 Treemap 方塊
  leafGroups
    .append("clipPath")
    .attr("id", (node) => `treemap-clip-${node.data.rank}`)
    .append("use")
    .attr("href", (node) => `#treemap-rect-${node.data.rank}`);

  // 公司名稱：前 60 名
  leafGroups
    .filter((node) => node.data.rank <= COMPANY_LABEL_MAX_RANK)
    .append("text")
    .attr("clip-path", (node) => `url(#treemap-clip-${node.data.rank})`)
    .attr("x", 5)
    .attr("y", 18)
    .attr("fill", "var(--color-background)")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .attr("pointer-events", "none")
    .text((node) => node.data.name);

  // 市值佔比：前 50 名
  leafGroups
    .filter((node) => node.data.rank <= RATIO_LABEL_MAX_RANK)
    .append("text")
    .attr("clip-path", (node) => `url(#treemap-clip-${node.data.rank})`)
    .attr("x", 5)
    .attr("y", 35)
    .attr("fill", "var(--color-background)")
    .attr("fill-opacity", 0.7)
    .attr("font-size", "11px")
    .attr("pointer-events", "none")
    .text((node) => formatPercentage(node.data.marketCapRatio, 4));

  // Legend：僅顯示前 4 組，即前 200 名
  const bucketCount = Math.max(1, Math.ceil(children.length / BUCKET_SIZE));
  const visibleBucketCount = Math.min(bucketCount, MAX_VISIBLE_BUCKETS);

  const legend = svg.append("g").attr("transform", `translate(5, ${height - 25})`);

  const legendItems = legend
    .selectAll<SVGGElement, number>("g")
    .data(d3.range(visibleBucketCount))
    .join("g")
    .attr("transform", (_bucketIndex, index) => `translate(${index * 110}, 0)`);

  legendItems
    .append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", (bucketIndex) => getChartColor(bucketIndex))
    .attr("rx", 3);

  legendItems
    .append("text")
    .attr("x", 20)
    .attr("y", 11)
    .attr("fill", "var(--color-brand)")
    .attr("font-weight", "bold")
    .text(
      (bucketIndex) =>
        `${bucketIndex * BUCKET_SIZE + 1} - ${Math.min(
          (bucketIndex + 1) * BUCKET_SIZE,
          children.length,
        )} 名`,
    );
}

/** 取得 Treemap 資料；API 不可用或無有效資料時使用 mock。 */
async function loadTreemapData(): Promise<void> {
  let data: MarketTreemapData = mockData;

  try {
    const liveData = await fetchMarketTreemapData({
      market: "TWSE",
    });

    if (liveData.children.length > 0) {
      data = liveData;
    }
  } catch (error) {
    console.warn("[MarketCapitalizationTreemap] 取得後端資料失敗，改用 mockData：", error);
  }

  treemapData.value = data;

  renderTreemap(data);
}

onMounted(() => {
  void loadTreemapData();

  const containerElement = chartContainerRef.value;

  if (!containerElement || typeof ResizeObserver === "undefined") {
    return;
  }

  resizeObserver = new ResizeObserver(() => {
    if (treemapData.value) {
      renderTreemap(treemapData.value);
    }
  });

  resizeObserver.observe(containerElement);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped></style>
