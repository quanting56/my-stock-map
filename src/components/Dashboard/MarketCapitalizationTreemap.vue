<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <h3 class="font-medium mb-3 text-[color:var(--color-secondary)]">市值佔比</h3>
    <div ref="chartContainer" class="w-full h-[500px] relative"></div>
  </div>
</template>

<script setup>
import * as d3 from "d3";
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from "vue";

// --- mock data 模擬上市公司市值 ---
const mockData = {
  name: "TWSE",
  children: [
    {
      name: "半導體",
      children: [
        { name: "台積電 (2330)", value: 1800000 },
        { name: "聯電 (2303)", value: 450000 },
        { name: "世界先進 (5347)", value: 160000 },
      ],
    },
    {
      name: "電子零組件",
      children: [
        { name: "鴻海 (2317)", value: 900000 },
        { name: "華通 (2313)", value: 120000 },
      ],
    },
    {
      name: "金融",
      children: [
        { name: "中信金 (2891)", value: 400000 },
        { name: "富邦金 (2881)", value: 370000 },
        { name: "國泰金 (2882)", value: 350000 },
      ],
    },
  ],
};

const chartContainer = ref(null);
let resizeObserver = null;

// --- D3 畫圖主函式 ---
function drawTreemap(data) {
  if (!chartContainer.value) return;

  // 清空畫面
  d3.select(chartContainer.value).selectAll("*").remove();

  const width = chartContainer.value.clientWidth;
  const height = chartContainer.value.clientHeight;

  // color scale
  const color = d3.scaleOrdinal(d3.schemeTableau10);

  // compute layout
  const root = d3
    .hierarchy(data)
    .sum((d) => d.value)
    .sort((a, b) => b.value - a.value);

  d3.treemap().size([width, height]).padding(1)(root);

  const svg = d3
    .select(chartContainer.value)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "font: 12px sans-serif;");

  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  // 矩形
  leaf
    .append("rect")
    .attr("fill", (d) => {
      let node = d;
      while (node.depth > 1) node = node.parent;
      return color(node.data.name);
    })
    .attr("fill-opacity", 0.65)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("stroke", "var(--color-border)")
    .attr("rx", 4)
    .attr("ry", 4);

  // 公司名稱
  leaf
    .append("text")
    .attr("x", 4)
    .attr("y", 16)
    .attr("fill", "var(--color-primary)")
    .text((d) => d.data.name)
    .call((text) =>
      text
        .filter((d) => d.x1 - d.x0 > 100 && d.y1 - d.y0 > 20)
        .attr("font-size", "12px")
    );

  // 市值數值
  leaf
    .append("text")
    .attr("x", 4)
    .attr("y", 32)
    .attr("fill", "var(--color-secondary)")
    .attr("font-size", "11px")
    .text((d) => `${d3.format(",")(d.data.value)} M`);
}

onMounted(() => {
  nextTick(() => drawTreemap(mockData));

  // 視窗調整時自動重繪
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

<style scoped>
.card-theme {
  background: var(--color-card);
}
</style>
