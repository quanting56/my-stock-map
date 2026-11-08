<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-medium text-foreground-muted">大盤市值佔比</h3>

      <div class="text-xs text-foreground-muted">
        資料最後更新時間：{{ displayDate || "載入中..." }}
      </div>
    </div>

    <div class="h-108 w-full">
      <TreemapChart
        :items="chartItems"
        chart-aria-label="臺灣上市公司大盤市值佔比圖"
      ></TreemapChart>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import { formatPercentage } from "@/utils/format/number";
import { fetchMarketTreemapData, type MarketTreemapData } from "@/api/stocksApi";
import { mockData } from "@/data/mock/marketCapitalizationTreemapData";

import TreemapChart from "@/components/charts/TreemapChart.vue";

const treemapData = ref<MarketTreemapData | null>(null);

const displayDate = computed(() => treemapData.value?.date ?? "");

const chartItems = computed(
  () =>
    treemapData.value?.children.map((item) => ({
      id: item.id,
      label: item.name,
      secondaryLabel: item.id,
      value: item.marketCapRatio,
      displayValue: `${formatPercentage(item.marketCapRatio, 4)}`,
    })) ?? [],
);

/** 取得大盤市值資料；API 不可用或無有效資料時使用 mock。 */
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
    console.warn("[MarketCapitalizationCard] 取得後端資料失敗，改用 mockData：", error);
  }

  treemapData.value = data;
}

onMounted(() => {
  void loadTreemapData();
});
</script>

<style scoped></style>
