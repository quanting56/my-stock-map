<template>
  <div class="card-theme rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium">📊 滾動報酬率比較</h3>

      <!-- 右上角：顯示選項快速切換（純 UI 狀態） -->
      <div class="flex gap-2 text-xs text-[color:var(--color-secondary)]">
        <template v-for="option in isLogOptions" :key="option.value">
          <button
            class="px-2 py-1 rounded border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)] transition cursor-pointer"
            :class="useLog === option.value ? 'bg-[color:var(--color-card)] font-semibold' : ''"
            @click="useLog = option.value"
          >
            ⎇ {{ option.label }}
          </button>
        </template>
      </div>
    </div>

    <!-- 主體：左側控制 + 右側圖區 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- 左：控制面板 -->
      <aside class="lg:col-span-4 space-y-4">
        <!-- 指數清單（可多選，純 UI） -->
        <div>
          <h4 class="text-sm font-medium mb-2">選擇要比較的 個股 或 ETF</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              v-for="stock in catalogList"
              :key="stock.id"
              class="flex items-center gap-2 text-sm"
            >
              <input type="checkbox" v-model="selected" :value="stock.id" />
              {{ stock.name }}（{{ stock.id }}）
            </label>
          </div>
        </div>

        <!-- 自訂代號（純 UI） -->
        <form class="grid grid-cols-3 gap-2" @submit.prevent="addCustomSymbol">
          <div class="col-span-2">
            <label class="text-sm text-[color:var(--color-secondary)] block mb-1">自訂代號</label>
            <input
              v-model="customSymbol"
              type="text"
              placeholder="例如：^DJI 或 0050.TW"
              class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              class="w-full px-3 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)]"
            >
              ➕ 加入
            </button>
          </div>
        </form>

        <!-- 圖層/順序（純 UI Demo：可日後做拖拉排序） -->
        <div>
          <h4 class="text-sm font-medium mb-2">圖層與可見度</h4>
          <div class="space-y-2">
            <div
              v-for="s in selected"
              :key="s"
              class="flex items-center justify-between px-3 py-2 rounded-lg border border-[color:var(--color-border)]"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-block w-3 h-3 rounded-full"
                  :style="{ background: colorFor(s) }"
                ></span>
                <span class="text-sm">{{ s }}</span>
              </div>
              <div class="flex gap-2 text-xs text-[color:var(--color-secondary)]">
                <button
                  @click="setLayerMode(s, 'normal')"
                  :class="modeOf(s) === 'normal' ? 'font-semibold underline' : ''"
                  class="text-xs text-[color:var(--color-secondary)] hover:underline cursor-pointer"
                >
                  正常
                </button>
                <button
                  @click="setLayerMode(s, 'faded')"
                  :class="modeOf(s) === 'faded' ? 'font-semibold underline' : ''"
                  class="text-xs text-[color:var(--color-secondary)] hover:underline cursor-pointer"
                >
                  透明
                </button>
                <button
                  @click="setLayerMode(s, 'hidden')"
                  :class="modeOf(s) === 'hidden' ? 'font-semibold underline' : ''"
                  class="text-xs text-[color:var(--color-secondary)] hover:underline cursor-pointer"
                >
                  隱藏
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右：圖表區（目前只放占位） -->
      <section class="lg:col-span-8">
        <div class="h-full min-h-72 rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center flex-col">
          <div ref="containerRef"></div>
          <!-- <div class="text-[color:var(--color-secondary)] opacity-70 my-2">[Index Chart Demo：此圖未與專案資料綁定，僅用作示意]</div> -->
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from "vue";
import * as d3 from "d3";

// mock data，作為測試用與備援用
import { mockData2330 } from "@/data/mock/mockData2330.js";
import { mockData2412 } from "@/data/mock/mockData2412.js";
import { mockData2881 } from "@/data/mock/mockData2881.js";

const selected = ref(["2412.TW", "2330.TW"]);  // 預設先選兩條，方便展示
const customSymbol = ref("");  // 自訂代號

const containerRef = ref(null);  // 圖形容器

// 指數給定顏色
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
const colorFor = (key) => colorScale(key);

const DATASETS = {
  "2330.TW": { id: "2330.TW", name: "台積電", data: mockData2330 },
  "2412.TW": { id: "2412.TW", name: "中華電", data: mockData2412 },
  "2881.TW": { id: "2881.TW", name: "富邦金", data: mockData2881 },
};

// 把「已選但不在 DATASETS 的代號」也補成清單項目，name 先用 id 代替
const catalogList = computed(() => {
  const base = Object.values(DATASETS);  // 提供給 <template> 用的「陣列版」資料，避免直接 v-for 物件
  const customs = [...new Set(selected.value)].filter(id => !DATASETS[id])
                                              .map(id => ({ id, name: id }));
  return [...base, ...customs];
});

const cache = new Map();


// 加入到滾動報酬率圖作比較
function addCustomSymbol() {
  const v = (customSymbol.value || "").trim();
  if (!v) return;
  if (!selected.value.includes(v)) selected.value.push(v);
  customSymbol.value = "";
};

const isLogOptions = [
  { label: "一般刻度", value: false },
  { label: "對數刻度", value: true },
];
const useLog = ref(false);  // 預設使用一般刻度


// 個股標籤上的顯示狀態
// 每條線的顯示狀態
const layerMode = ref({}); // 例如 { "2330.TW": "faded", "2412.TW": "hidden" }

// 工具函式
function modeOf(key) {
  return layerMode.value[key] ?? "normal";
}
function opacityFor(key) {
  const m = modeOf(key);
  return m === "hidden" ? 0 : m === "faded" ? 0.3 : 1;
}
function setLayerMode(key, mode) {
  layerMode.value = { ...layerMode.value, [key]: mode };
}


// 支援「補零/不補零」的日期；失敗則最後用 new Date 作保險
const dateParsers = [
  d3.timeParse("%Y/%m/%d"),
  d3.timeParse("%Y/%m/%-d"),
  d3.timeParse("%Y/%-m/%d"),
  d3.timeParse("%Y/%-m/%-d")
];
function parseDateLoose(s) {
  for (const p of dateParsers) {
    const d = p(s);
    if (d) return d;
  }
  return new Date(s.replace(/\//g, "-"));
}

async function loadOne(symbol) {
  if (cache.has(symbol)) return cache.get(symbol);

  const meta = DATASETS[symbol];
  if (!meta?.data) return [];
  const rows = meta.data
    .map(d => ({
      Date: parseDateLoose(d.date),
      Close: +(d.adjClose ?? d.close)  // 先嘗試 adjClose，沒有再退回 close
    }))
    .filter(d => d.Date instanceof Date && !isNaN(+d.Date) && Number.isFinite(d.Close))  // 過濾掉 parse 失敗或價格無效
    .sort((a, b) => a.Date - b.Date);  // 依日期排序（bisector 需要遞增序列）
  cache.set(symbol, rows);
  return rows;
};

// 依 selected 組 series（正規化到起點 = 1）
async function getSeries(symbols) {
  const arrays = await Promise.all(symbols.map(loadOne));
  return symbols.map((sym, i) => {
    const values = arrays[i] || [];
    if (!values.length) return { key: sym, values: [] };
    // 取第一個有限的 Close（保守一點）
    const base = values.find(v => Number.isFinite(v.Close))?.Close ?? 1;
    return {
      key: sym,
      values: values.map(v => ({ Date: v.Date, value: v.Close / base }))
    };
  });
};

// D3.js 繪圖
function draw(series) {
  // 清掉舊圖，避免重疊
  d3.select(containerRef.value).selectAll("*").interrupt().remove();

  const width = 928;
  const height = 600;
  const marginTop = 20;
  const marginRight = 60;
  const marginBottom = 30;
  const marginLeft = 50;

  const allDates = series.flatMap(s => s.values.map(v => v.Date));
  if (!allDates.length) return;

  // 橫軸比例尺（時間比例尺）
  const x = d3.scaleUtc()
              .domain(d3.extent(allDates))
              .range([marginLeft, width - marginRight])
              .clamp(true);  // 夾住範圍，防止超出

  // 縱軸比例尺
  let y;
  if (!useLog.value) {
    // const maxV = d3.max(series, (s) => d3.max(s.values, v => v.value)) || 1;
    y = d3.scaleLinear()  // 使用一般尺度處理比例
          .domain([0, 11])
          .rangeRound([height - marginBottom, marginTop]);
  } else {
    const k = d3.max(series, ({ values }) => {
      const vs = values.map(v => v.value)
                       .filter(v => Number.isFinite(v) && v > 0);
      const min = d3.min(vs) ?? 1;
      const max = d3.max(vs) ?? 1;
      return max / Math.max(min, 1e-6);
    }) || 1;
    y = d3.scaleLog()  // 使用對數尺度處理比例
          .domain([1 / k, k])
          .rangeRound([height - marginBottom, marginTop]);
  };

  const svg = d3.select(containerRef.value)
                .append("svg")
                .attr("width", width)
                .attr("height", height)
                .attr("viewBox", [0, 0, width, height])
                .attr("style", "max-width: 100%; height: auto; -webkit-tap-highlight-color: transparent;");

  // 創建 x 軸
  svg.append("g")
     .attr("transform", `translate(0,${height - marginBottom})`)
     .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))  // 設置刻度
     .call(g => g.select(".domain").remove());  // 移除軸線

  // 創建 y 軸
  // y-grid 與 y-axis 以兩個 group 管理，之後覆寫不會堆節點
  const gridG = svg.append("g")
                    .attr("transform", `translate(${marginLeft},0)`)
  const yAxisG = svg.append("g")
                    .attr("transform", `translate(${marginLeft},0)`);

  // 固定的刻度值
  const TICKS_LOG = [0.2, 0.5, 0.7, 1, 2, 3, 6, 10, 20, 50];
  const TICKS_LIN = [0, 0.3, 0.5, 0.7, 1, 2, 3, 4, 6, 11, 21, 41, 101];  // (= -100% ~ +9900% 視情況顯示)
  const TICK_FMT_LOG = (d) => `${d3.format(".2~f")(d)}×`;
  const TICK_FMT_LIN = (d) => d3.format("+.0%")(d - 1);  // "-1"是剪掉本金

  // 處理 Y 軸 與 刻度延伸線
  function renderAxis() {
    const ticks    = useLog.value ? TICKS_LOG : TICKS_LIN;
    const tickFmt  = useLog.value ? TICK_FMT_LOG : TICK_FMT_LIN;

    // Y 軸
    yAxisG.call(d3.axisLeft(y).tickValues(ticks).tickFormat(tickFmt));
    yAxisG.select(".domain").remove();

    // 透明橫線（刻度延伸線）
    gridG.call(d3.axisLeft(y).tickValues(ticks).tickSize(-(width - marginLeft - marginRight)).tickFormat(""));
    gridG.select(".domain").remove();
    gridG.selectAll(".tick line").attr("stroke-opacity", 0.2);  // 修改刻度線的透明度
  }
  renderAxis();

  // 基準線（一般刻度的 +0% / 對數刻度的 1×）
  const baselineG = svg.append("g").attr("pointer-events", "none");
  function baseline() {
    const y1 = y(1);  // value = 1 對應 +0% / 1×
    baselineG
      .selectAll("line.baseline")
      .data([1])
      .join("line")
      .attr("class", "baseline")
      .attr("x1", marginLeft)
      .attr("x2", width - marginRight)
      .attr("y1", y1)
      .attr("y2", y1)
      .attr("stroke", "var(--color-text)")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 1);
  }
  baseline();

  // 各系列的全域 min/max（在「起點=1」規格下）
  const stats = series.map(s => ({
    key: s.key,
    values: s.values,
    min: d3.min(s.values, v => v.value) ?? 1,
    max: d3.max(s.values, v => v.value) ?? 1
  }));

  const lineChart = d3.line()
                     .x(d => x(d.Date));  // 根據日期定位 X 座標，Y 在 update 時依當日基準切換

  // 依日期找索引
  const bisectDate = d3.bisector(d => d.Date).left;

  const serie = svg.append("g")
                   .style("font", "bold 10px sans-serif")
                   .selectAll("g")
                   .data(series)
                   .join("g")
                   .attr("class", "series");
  // path
  serie.append("path")
       .attr("fill", "none")
       .attr("stroke-width", 2)
       .attr("stroke-linejoin", "round")
       .attr("stroke-linecap", "round")
       .attr("stroke", d => colorFor(d.key))
       // .attr("d", d => line(d.values));
       .attr("d", d => lineChart.y(v => y(v.value))(d.values));

  // 為每個系列添加末尾的標籤
  serie.append("text")
       .datum(d => ({ key: d.key, value: d.values.at(-1)?.value ?? 1 }))
       .attr("fill", d => colorFor(d.key))
       .attr("paint-order", "stroke")
       .attr("stroke", "white")
       .attr("stroke-width", 3)
       .attr("font-size", 16)
       .attr("x", x.range()[1] + 3)  // 標籤放在最右側
       .attr("y", d => y(d.value))  // 根據價值決定 Y 位置
       .attr("dy", "0.5em")
       .text(d => DATASETS[d.key]?.name ?? d.key);  // 顯示股票名稱

  // 套用顯示狀態（只改 opacity，不影響計算）
  function applyVisibility() {
    const seriesSel = svg.selectAll("g.series");
    seriesSel.select("path").attr("opacity", d => opacityFor(d.key));
    seriesSel.select("text").attr("opacity", d => opacityFor(d.key));
  }
  applyVisibility();  // 初次畫完就套一次

  // 創建一條垂直規則線，作為指示
  const rule = svg.append("g")
                  .append("line")
                  .attr("y1", height)
                  .attr("y2", 0)
                  .attr("stroke", "var(--color-text)")
                  .attr("opacity", 0.25);

  // 將值 v 轉成「相對滑鼠日 curr」後的像素 y；同時支援 linear/log
  function yRel(v, curr) {
    // 直接使用 v/curr 送進 y（log 與 linear 都成立）
    return y(v / Math.max(curr, 1e-12));
  };

  // 新：用分位數取得 [lo, hi]，避免單一極端值把視域釘死
  function computeRelExtentQuantile(date, qLow = 0.00, qHigh = 0.95) {
    const lows  = [];
    const highs = [];
    for (const s of stats) {
      const i    = Math.min(Math.max(bisectDate(s.values, date, 0, s.values.length - 1), 0), s.values.length - 1);
      const curr = s.values[i]?.value ?? 1;
      const inv  = 1 / Math.max(curr, 1e-12);
      lows.push(s.min * inv);
      highs.push(s.max * inv);
    }
    let lo = d3.quantileSorted(lows.sort(d3.ascending),  qLow)  ?? 0.8;
    let hi = d3.quantileSorted(highs.sort(d3.ascending), qHigh) ?? 1.5;
    // 確保含 1、加點 padding，且至少有寬度
    lo = Math.max(0, Math.min(lo, 1) * 0.95);
    hi = Math.max(1, hi * 1.05);
    if (hi / Math.max(lo, 1e-6) < 1.15) { // 避免過窄
      const mid = (hi + lo) / 2;
      lo = mid / 1.1; hi = mid * 1.1;
    }
    return [lo, hi];
  }

  // 定義更新函數，根據日期移動規則線和線條
  function update(date) {
    date = d3.utcDay.round(date);
    rule.attr("transform", `translate(${x(date) + 0.5},0)`);

    // 一般刻度：用分位數域，避免最大線被釘住；tickValues 仍為「寫死」
    if (!useLog.value) {
      let [lo, hi] = computeRelExtentQuantile(date);

      // 🔸中線約束：讓 1× 不會高過一半
      // 1 在 domain 的位置 t = (1 - lo)/(hi - lo)，要 t <= 0.5  ⇒  hi >= 2 - lo
      const minHiForMid = 2 - lo;
      if (hi < minHiForMid) hi = minHiForMid;

      // （可選）保底寬度，避免過窄
      if ((hi - lo) < 0.1) {
        const mid = (hi + lo) / 2;
        lo = mid - 0.05; hi = mid + 0.05;
      }

      const [oldLo, oldHi] = y.domain();
      if (lo !== oldLo || hi !== oldHi) {
        y.domain([lo, hi]);
        renderAxis();  // 以寫死 tickValues 重畫，但位置會跟著 domain 改變
        baseline();  // ← 重新擺放基準線
      }
    }

    // 就算 domain 沒變，滑鼠移動仍要對齊基準線
    if (useLog.value) {
      // log 模式 domain 沒跟著滑鼠改，但基準線仍需對應 y(1)
      baseline();
    } else {
      // linear 模式若上面沒改 domain，也要更新一次基準線（確保位置正確）
      baseline();
    }

    // 逐條線，用「v/curr」重算 y；線粗細/文字大小不會變
    serie.each(function({ values }) {
      const i = Math.min(Math.max(bisectDate(values, date, 0, values.length - 1), 0), values.length - 1);
      const curr = values[i]?.value ?? 1;
 
      d3.select(this).select("path").attr("d", lineChart.y(d => yRel(d.value, curr))(values));
 
      // 重算右側標籤 y（同樣用最後一點的 v/curr）
      const last = values.at(-1)?.value ?? 1;
      d3.select(this)
        .select("text")
        .attr("y", yRel(last, curr));
    });
  };

  d3.transition()
    .ease(d3.easeCubicOut)
    .duration(800)
    .tween("date", () => {
      const i = d3.interpolateDate(x.domain()[1], x.domain()[0]);
      return t => update(i(t));
    });

  svg.on("mousemove touchmove", function (e) {
    update(x.invert(d3.pointer(e, this)[0]));
    e.preventDefault();
  });
}

// 串起整個流程：讀 selected → 轉 series → 繪圖
async function refresh() {
  const symbols = selected.value.filter(s => !!DATASETS[s]);
  const series = await getSeries(symbols);
  draw(series);
};

// 初次與後續變更都會重繪
onMounted(refresh);

watch([selected, useLog], refresh, { deep: true });

// 只更新透明度，不重繪整張（避免閃爍）
watch(layerMode, () => {
  const svg = d3.select(containerRef.value).select("svg");
  if (!svg.empty()) {
    svg.selectAll("g.series").select("path")
      .attr("opacity", d => opacityFor(d.key));
    svg.selectAll("g.series").select("text")
      .attr("opacity", d => opacityFor(d.key));
  }
}, { deep: true });
</script>

<style scoped></style>
