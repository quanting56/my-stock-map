<template>
  <LoadingModal :open="isLoading" message="股票資訊載入中"></LoadingModal>
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

    <!-- 輕提示（toast/snackbar） -->
    <div
      v-if="toast.show"
      class="fixed left-1/2 top-6 -translate-x-1/2 z-[9999]"
    >
      <div class="px-3 py-2 rounded-lg shadow border border-[color:var(--color-text)] bg-[color:var(--color-card)] text-sm">
        {{ toast.message }}
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
              <input type="checkbox" v-model="selected" :value="toCore(stock.id)" />
              {{ stock.name }}（{{ toDisplayId(stock.id) }}）
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
              placeholder="例如：0052 或 00675L"
              class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              class="w-full px-3 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)] cursor-pointer"
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
                <span class="text-sm">{{ toDisplayId(s) }}</span>
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
import LoadingModal from "@/components/Common/LoadingModal.vue";
import * as d3 from "d3";
import { fetchStockSeries, fetchSymbolProfile } from "@/api/stocksApi";

const isLoading = ref(false);

const isLogOptions = [
  { label: "對數刻度", value: true },
  { label: "一般刻度", value: false }
];
const useLog = ref(true);  // 預設使用對數刻度

// mock data，作為測試用與備援用
import { mockData2330 } from "@/data/mock/mockData2330.js";
import { mockData2412 } from "@/data/mock/mockData2412.js";
import { mockData2881 } from "@/data/mock/mockData2881.js";
import { mockData0050 } from "@/data/mock/mockData0050.js";

const selected = ref(["2412", "2330"]);  // 預設先選兩條，方便展示
const customSymbol = ref("");  // 自訂代號（例：2330、2330.TW、0050、0050.TW）

// 輕提示 toast
const toast = ref({ show: false, message: "" });
let toastTimer = null;
function showToast(msg, ms = 3000) {
  toast.value = { show: true, message: msg };
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value.show = false), ms);
};

const containerRef = ref(null);  // 圖形容器

// 簡易重試狀態（避免第一次灌庫期間畫面提前結束）
let retryTimer = null;
let retryAttempts = 0;

// 指數給定顏色
const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
const colorFor = (key) => colorScale(key);

// 名稱快取，用於標籤與左側清單顯示
const nameMap = ref(new Map()); // Map<coreCode, displayName>

// 將輸入轉核心代碼（去 .TW）
function toCore(code = "") {
  const v = String(code || "").toUpperCase().replace(/\.TW$/, "");
  return v;
};
// 僅允許台股代碼（4~5 碼 + 可選 1 字母）
function isTaiwanId(code = "") {
  return /^\d{4,6}[A-Z]{0,2}$/.test(toCore(code));
};
// 圖上標籤顯示優先使用名稱
function labelFor(core) {
  return nameMap.value.get(core) || DATASETS[core]?.name || core;
};

// 預設會顯示的待選選項 & 其備用 mock data
const DATASETS = {
  "2330": { id: "2330", name: "台積電", data: mockData2330 },
  "2412": { id: "2412", name: "中華電", data: mockData2412 },
  "2881": { id: "2881", name: "富邦金", data: mockData2881 },
  "0050": { id: "0050", name: "元大台灣50", data: mockData0050 }
};

// 曾加入過的代號池（只在本次 session 有效），用來讓「取消勾選後仍留在 UI」
const catalogPool = ref(new Set(Object.keys(DATASETS))); // NEW
const catalogList = computed(() => {                      // CHANGED
  const out = [];
  const seen = new Set();
  for (const id of catalogPool.value) {
    const core = toCore(id);
    if (seen.has(core)) continue;
    seen.add(core);
    out.push({ id: core, name: nameMap.value.get(core) || DATASETS[core]?.name || toDisplayId(core) });
  };
  return out;
});

const cache = new Map();

// --- 輔助：把使用者輸入正規化為「台股代碼」與「顯示用ID」 --- //
function toTwCode(input) {  // 取出 4~5 碼台股代碼；容忍 .TW
  const s = String(input || "").toUpperCase().trim();
  const m = s.match(/^(\d{4,6}[A-Z]{0,2})(?:\.?TW)?$/);
  return m ? m[1] : null;  // 例如 "2330.TW" -> "2330"
};
function toDisplayId(input) {  // 顯示用標籤，一致為 2330.TW
  const c = toTwCode(input);
  return c ? `${c}.TW` : String(input || "").toUpperCase().trim();
};


// 加入到滾動報酬率圖作比較
async function addCustomSymbol() {
  const raw = (customSymbol.value || "").trim();
  if (!raw) return;

  if (!isTaiwanId(raw)) {
    showToast("此 股票代碼 / 股票名稱 不在服務範圍內 ：（");
    console.warn("[RollingReturnTest] 支援台股代碼（4~6 碼 + 可選 1~2 英文字尾），例如 2330、00675L、00768B、006208。");
    return;
  };

  const core = toCore(raw);

  // 先向後端驗證是否為存在的代號（避免 regex 通過但實際查無此股）
  try {
    // 立刻有回饋（或直接用 isLoading 顯示 LoadingModal）
    isLoading.value = true;
    showToast("正在查詢代號…", 1200);
    const prof = await fetchSymbolProfile(core);
    if (!prof) {
      showToast(`查無此代號：${toDisplayId(core)}`);
      isLoading.value = false;
      return;
    };
    if (prof?.name) nameMap.value.set(core, prof.name); // 順便把名稱快取
  } catch {
    // 後端暫時連不到/錯誤時，不要把代號加入，顯示輕提示
    showToast("查詢逾時或伺服器忙碌，請稍後再試");
    isLoading.value = false;
    return;
  };

  // 通過驗證才加入 UI
  catalogPool.value = new Set([...catalogPool.value, core]);  // 放進清單池，就算未勾選也會留在 UI，直到重新整理
  if (!selected.value.includes(core)) selected.value.push(core);
  customSymbol.value = "";
  isLoading.value = false;
};


// 個股標籤上的顯示狀態
// 每條線的顯示狀態
const layerMode = ref({});  // 例如 "2330", "2412"

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


// 可從「後端 API 優先，mock 作備援」載入一條線的資料
async function loadOne(symbol) {
  const core = toCore(symbol);
  if (cache.has(core)) return cache.get(core);

  const meta = DATASETS[core];
  const hasMock = !!meta?.data;   // 是否有 mock 資料
  const code = toTwCode(core);    // 統一處理 TW 代碼
  let rows = [];

  // 小工具：把 mockData 轉成標準 rows
  const fromMock = () => {
    if (!hasMock) return [];
    return meta.data
      .map(d => ({
        Date: parseDateLoose(d.date),
        Close: +(d.adjClose ?? d.close)
      }))
      .filter(d => d.Date instanceof Date && !isNaN(+d.Date) && Number.isFinite(d.Close))
      .sort((a, b) => a.Date - b.Date);
  };

  // 若不是可支援的台股代碼，只能靠 mock（若有）
  if (!code) {
    console.warn(`[rolling] 暫不支援此代號：${symbol}`);
    showToast(`暫不支援此代號：${symbol}`);
    rows = fromMock();                        // 有 mock 就至少畫得出東西
    if (rows.length) cache.set(core, rows);   // 只快取有資料的
    return rows;
  }

  try {  // 先嘗試 API（預設路徑）
    // 先驗證是否存在，避免錯誤代號讓後端白跑
    const prof = await fetchSymbolProfile(code);
    if (!prof) {
      console.warn(`[rolling] 找不到代號：${code}`);
      rows = fromMock();  // 查無此股就退回 mock（若有）
    } else {
      if (prof?.name) nameMap.value.set(core, prof.name);

      const now = new Date();
      const params = {
        startYear: now.getFullYear() - 20,
        startMonth: 1,
        endYear: now.getFullYear(),
        endMonth: now.getMonth() + 1,
        direction: "backward"
      };
      const arr = await fetchStockSeries(code, params);
      rows = (arr || [])
        .map(r => ({
          Date: (r.date instanceof Date) ? r.date : new Date(r.date),
          Close: +(r.adjClose ?? r.close)
        }))
        .filter(d => d.Date instanceof Date && !isNaN(+d.Date) && Number.isFinite(d.Close))
        .sort((a, b) => a.Date - b.Date);

      // 若 API 沒回資料，又恰好有 mock，也退回 mock
      if (!rows.length && hasMock) {
        rows = fromMock();
      }
    }
  } catch (e) {  // API 失敗才進這裡
    console.warn(`[rolling] API 失敗，改用備援（若有） ${symbol}:`, e?.message || e);
    rows = fromMock();  // 有 mock 就改用 mock；沒有就 []
    if (!rows.length) {
      showToast("載入歷史資料失敗，請稍後再試");  // 完全沒有資料時給個提示
    }
  }

  if (rows.length) {  // 只快取「有資料」結果
    cache.set(core, rows);
  }
  return rows;
};


// 依 selected 組 series（正規化到起點 = 1）
async function getSeries(symbols) {
  const arrays = await Promise.all(symbols.map(loadOne));  // 可能含 mock 或 API 回來的資料
  return symbols.map((sym, i) => {
    const values = arrays[i] || [];
    if (!values.length) return { key: sym, values: [] };
    // 取第一個有限的 Close（保守一點）
    const base = values.find(v => Number.isFinite(v.Close))?.Close ?? 1;
    return {
      key: toCore(sym),  // 用核心代碼做 key
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
  const marginRight = 80;
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
       .text(d => labelFor(d.key));  // 有名稱就顯示名稱，否則代碼

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
      };
    };
    
    baseline();  // 重新擺放基準線

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
  isLoading.value = true;
  const symbols = selected.value.slice();
  const series = await getSeries(symbols);
  draw(series);
  const hasEmpty = series.some(s => (s.values?.length || 0) === 0);
  if (hasEmpty && retryAttempts < 2) {
    clearTimeout(retryTimer);
    retryAttempts += 1;
    showToast("第一次載入歷史資料，時間較久，請稍候…");
    retryTimer = setTimeout(() => { refresh(); }, 4000);  // 短延遲重試
    // 保持 LoadingModal 不關閉
  } else {
    retryAttempts = 0;
    isLoading.value = false;
  };
};

// 初次與後續變更都會重繪
onMounted(async () => {
  catalogPool.value = new Set([...catalogPool.value, ...selected.value.map(toCore)]);  // 確保預設選項也在清單池
  for (const id of selected.value) {
    const prof = await fetchSymbolProfile(id).catch(()=>null);
    if (prof?.name) nameMap.value.set(toCore(id), prof.name);
  };
  refresh();
});

// 變更代號或軸尺度就重繪
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
