<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">大盤市值佔比</h3>
      <div class="text-xs text-[color:var(--color-secondary)]">資料最後更新時間：{{ mockData.date }}</div>
    </div>
    <div ref="chartContainer" class="w-full h-full min-h-96 relative"></div>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";

// --- mock data 模擬上市公司市值 ---
import { mockData } from "@/data/mock/marketCapitalizationTreemapData.js"

const chartContainer = ref(null);
let resizeObserver = null;

// --- D3 畫圖主函式 ---
function drawTreemap(data) {
  if (!chartContainer.value) return;

  d3.select(chartContainer.value).selectAll("*").remove();

  const width = chartContainer.value.clientWidth;
  const height = chartContainer.value.clientHeight;

  // --- 排名分桶 ---
  const children = (data.children || []).slice();
  children.sort(
    (a, b) =>
      b.MarketCapitalizationAsAPercentageOfTheOverallMarket -
      a.MarketCapitalizationAsAPercentageOfTheOverallMarket
  );

  const bucketSize = 50;  // 照公司「市值占大盤比重」排名每 50 個一組 
  const mapping = new Map();
  children.forEach((child, idx) => {
    mapping.set(child.id, Math.floor(idx / bucketSize));
    child.rank = idx + 1;  // 🆕 儲存排名供 tooltip 顯示
  });

  const numBuckets = Math.max(1, Math.ceil(children.length / bucketSize));
  const color = d3.scaleOrdinal().domain(d3.range(numBuckets)).range(d3.schemeTableau10);

  // --- layout ---
  const root = d3.hierarchy(data)
                 .sum((d) => d.MarketCapitalizationAsAPercentageOfTheOverallMarket)
                 .sort(
                   (a, b) =>
                     b.MarketCapitalizationAsAPercentageOfTheOverallMarket -
                     a.MarketCapitalizationAsAPercentageOfTheOverallMarket
                 );

  d3.treemap()
    .tile(d3.treemapBinary)  // 用 d3.treemapBinary 的形式
    .size([width, height - 40])
    .padding(1)(root);

  const svg = d3.select(chartContainer.value)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "font: 12px sans-serif;");

  // --- Tooltip ---
  const tooltip = d3.select(chartContainer.value)
                    .append("div")
                    .attr("class", "absolute bg-white dark:bg-gray-800 text-sm p-2 rounded shadow border")
                    .style("opacity", 0)
                    .style("transition", "opacity 0.1s ease")
                    .style("pointer-events", "none");

  const leaf = svg.selectAll("g")
                  .data(root.leaves())
                  .join("g")
                  .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf.append("rect")
      .attr("id", (d) => `rect-${d.data.rank}`)  // 給每個 rect 一個唯一 id
      .attr("fill", (d) => {
        const key = d.data.id ?? d.data.name;
        return color(mapping.get(key) || 0);
      })
      .attr("fill-opacity", 0.9)
      .attr("width", (d) => d.x1 - d.x0)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("stroke", "var(--color-border)")
      .attr("rx", 4)
      .attr("ry", 4)
      // 🟢 加入 tooltip 事件
      .on("mouseover", (e, d) => {
        tooltip
          .style("opacity", 0.85)
          .html(
            `<strong>${d.data.name}</strong> <small>${d.data.id}</small><br/>
             排名第 ${d.data.rank} 名<br/>
             市值佔比：${(d.data.MarketCapitalizationAsAPercentageOfTheOverallMarket * 100).toFixed(4)}%`
          );
      })
      .on("mousemove", (e) => {
        tooltip
          .style("left", `${e.offsetX + 10}px`)
          .style("top", `${e.offsetY + 10}px`);
      })
      .on("mouseout", () => tooltip.style("opacity", 0));

  // 🆕 建立 clipPath，確保方塊內文字不超出方塊
  leaf.append("clipPath")
      .attr("id", (d) => `clip-${d.data.rank}`)
      .append("use")
      .attr("xlink:href", (d) => `#rect-${d.data.rank}`);

  // 公司名稱（僅顯示前 60 名）
  leaf.filter((d) => d.data.rank < 60)
      .append("text")
      .attr("clip-path", (d) => `url(#clip-${d.data.rank})`)
      .attr("x", 5)
      .attr("y", 18)
      .attr("fill", "#E5E7EB")
      .attr("font-size", "16px")
      .attr("font-weight", "bold")
      .attr("pointer-events", "none")
      .text((d) => d.data.name)
      .filter((d) => d.x1 - d.x0 > 100 && d.y1 - d.y0 > 20);

  // 市值排名數值（僅顯示前 50 名）
  leaf.filter((d) => d.data.rank < 50)
      .append("text")
      .attr("clip-path", (d) => `url(#clip-${d.data.rank})`)
      .attr("x", 4)
      .attr("y", 35)
      .attr("fill", "var(--color-secondary)")
      .attr("font-size", "11px")
      .attr("pointer-events", "none")
      .text(
        (d) =>
          `${(d.data.MarketCapitalizationAsAPercentageOfTheOverallMarket * 100).toFixed(4)}%`
      );

  // 圖例 Legend（僅前 4 組＝ 200 名）
  const visibleBuckets = Math.min(numBuckets, 4);
  const legend = svg.append("g")
                    .attr("transform", `translate(5, ${height - 25})`);

  const legendItem = legend.selectAll("g")
                           .data(d3.range(visibleBuckets))
                           .join("g")
                           .attr("transform", (d, i) => `translate(${i * 110}, 0)`);

  legendItem.append("rect")
            .attr("x", 0)
            .attr("width", 14)
            .attr("height", 14)
            .attr("fill", (d) => color(d))
            .attr("rx", 3);

  legendItem.append("text")
            .attr("x", 20)
            .attr("y", 11)
            .attr("fill", "var(--color-primary)")
            .attr("font-weight", "bold")
            .text(
              (d) =>
                `${d * bucketSize + 1} - ${Math.min(
                  (d + 1) * bucketSize,
                  children.length
                )} 名`
            );
}

onMounted(() => {
  nextTick(() => drawTreemap(mockData));
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(() => {
      drawTreemap(mockData);
    });
    resizeObserver.observe(chartContainer.value);
  }
});

onBeforeUnmount(() => {
  if (resizeObserver) resizeObserver.disconnect();
});
</script>

<style scoped></style>
