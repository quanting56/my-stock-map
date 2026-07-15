<template>
  <div class="p-6">
    <!-- Header -->
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">Dashboard</h1>
        <div class="text-sm text-[color:var(--color-secondary)]">一覽帳戶關鍵指標與視覺化趨勢</div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="refreshPrices" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white">更新價格</button>
        <button @click="randomizeAll" class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]">模擬波動</button>
        <button @click="exportCSV" class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]">匯出 CSV</button>
      </div>
    </header>

    <!-- Summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">總市值</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ formatCurrency(totalValue) }}</div>
        <div class="text-sm text-[color:var(--color-secondary)] mt-1">持倉：{{ totalPercent.toFixed(1) }}%</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">今日損益</h4>
        <div :class="['text-2xl font-bold mt-2', todayPnL >= 0 ? 'text-[color:var(--color-line2)]' : 'text-[color:var(--color-line3)]']">
          {{ formatCurrency(todayPnL) }}
        </div>
        <div class="text-sm text-[color:var(--color-secondary)] mt-1">{{ todayPnLPercent.toFixed(2) }}%</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">近 7 日漲跌</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-line3)]">{{ weekChangePercent.toFixed(2) }}%</div>
        <div class="text-sm text-[color:var(--color-secondary)] mt-1">觀察趨勢</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">現金 & 可用</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ formatCurrency(cash) }}</div>
        <div class="text-sm text-[color:var(--color-secondary)] mt-1">持倉數：{{ positionsCount }}</div>
      </div>
    </div>

    <!-- Main charts area -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Left: Donut + small list -->
      <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-[color:var(--color-secondary)]">資產分布</h3>
          <div class="text-xs text-[color:var(--color-secondary)]">{{ formatCurrency(totalValue) }}</div>
        </div>

        <div class="flex items-center gap-4">
          <!-- donut svg -->
          <div class="w-36 h-36 flex items-center justify-center">
            <svg viewBox="0 0 42 42" class="w-36 h-36">
              <defs></defs>
              <g transform="rotate(-90 21 21)">
                <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(0,0,0,0.04)" stroke-width="10"></circle>
                <template v-for="(seg, i) in segments" :key="i">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="transparent"
                    :stroke="legendColors[i % legendColors.length]"
                    stroke-width="10"
                    stroke-dasharray="100"
                    :stroke-dashoffset="seg.offset"
                    stroke-linecap="butt"
                    transform="translate(0,0)"
                  />
                </template>
              </g>
              <!-- center text -->
              <text x="21" y="22" text-anchor="middle" alignment-baseline="middle" class="text-[10px] fill-[color:var(--color-secondary)]" style="font-size:8px; fill:var(--color-secondary)">
                持倉
              </text>
            </svg>
          </div>

          <!-- legend -->
          <div class="flex-1">
            <ul class="space-y-2 text-sm">
              <li v-for="(p, idx) in positionsSorted.slice(0,6)" :key="p.symbol" class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="w-3 h-3 rounded-sm" :style="{ backgroundColor: legendColors[idx % legendColors.length] }"></span>
                  <div>
                    <div class="font-medium">{{ p.symbol }}</div>
                    <div class="text-xs text-[color:var(--color-secondary)]">{{ p.name }}</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-medium text-[color:var(--color-primary)]">{{ formatCurrency(p.value) }}</div>
                  <div class="text-xs text-[color:var(--color-secondary)]">{{ p.percent.toFixed(1) }}%</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Middle: Time series (sparkline + large placeholder) -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-[color:var(--color-secondary)]">市值趨勢</h3>
          <div class="text-xs text-[color:var(--color-secondary)]">範圍：30 日</div>
        </div>

        <!-- big sparkline -->
        <div class="h-44 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-3">
          <svg :viewBox="sparkViewBox" class="w-full h-full">
            <path :d="bigSparkPath" fill="none" stroke="var(--color-primary)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" />
            <g v-for="(pt, i) in series30" :key="i">
              <circle :cx="pt.x" :cy="pt.y" r="1.2" fill="var(--color-primary)" />
            </g>
          </svg>
        </div>

        <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-secondary)]">
          <div>當日成交量（示意）<div class="font-medium mt-1">{{ volume }}</div></div>
          <div class="text-right">最近變動: <span class="font-medium ml-2">{{ lastChangePct.toFixed(2) }}%</span></div>
        </div>
      </div>
    </div>

    <!-- holdings table and quick actions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4 overflow-auto">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-[color:var(--color-secondary)]">持倉明細</h3>
          <div class="text-xs text-[color:var(--color-secondary)]">資料即時性取決於 API</div>
        </div>

        <table class="w-full text-sm">
          <thead class="text-[color:var(--color-secondary)]">
            <tr>
              <th class="text-left">股票</th>
              <th class="text-right">數量</th>
              <th class="text-right">現價</th>
              <th class="text-right">市值</th>
              <th class="text-right">今日損益</th>
              <th class="text-right">權重</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pos in positionsSorted" :key="pos.symbol" class="border-t border-[color:var(--color-border)]">
              <td class="py-3">
                <div class="font-medium">{{ pos.symbol }}</div>
                <div class="text-xs text-[color:var(--color-secondary)]">{{ pos.name }}</div>
              </td>
              <td class="py-3 text-right">{{ pos.qty }}</td>
              <td class="py-3 text-right">{{ formatCurrency(pos.price) }}</td>
              <td class="py-3 text-right font-medium">{{ formatCurrency(pos.value) }}</td>
              <td class="py-3 text-right" :class="pos.pnl >= 0 ? 'text-[color:var(--color-line2)]' : 'text-[color:var(--color-line3)]'">
                {{ formatCurrency(pos.pnl) }}
              </td>
              <td class="py-3 text-right">{{ pos.percent.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">快速操作</h3>

        <div class="space-y-3 text-sm text-[color:var(--color-secondary)]">
          <div>
            <label class="block text-xs mb-1">搜尋股票</label>
            <input v-model="q" class="w-full px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" placeholder="例如 TSMC" />
          </div>

          <div>
            <button @click="addRandomPosition" class="w-full px-3 py-2 rounded-md bg-[color:var(--color-primary)] text-white">新增隨機持倉</button>
          </div>

          <div>
            <button @click="simulateTrade" class="w-full px-3 py-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]">模擬成交</button>
          </div>

          <div class="text-xs text-[color:var(--color-secondary)]">
            Tips: 這些操作只是前端 mock，如果接真實 API，要在後端做驗證與處理。
          </div>
        </div>
      </div>
    </div>

    <!-- timeline / notes -->
    <div class="card-theme rounded-2xl shadow p-4">
      <h3 class="font-medium mb-3">📅 最近事件</h3>
      <ul class="space-y-3">
        <li v-for="(e, i) in events" :key="i" class="flex items-start gap-3">
          <div class="text-xs text-[color:var(--color-secondary)] w-20">{{ e.date }}</div>
          <div>
            <div class="font-medium">{{ e.title }}</div>
            <div class="text-xs text-[color:var(--color-secondary)]">{{ e.detail }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

/* --- mock data --- */
const positions = ref([
  { symbol: "TSMC", name: "台積電", qty: 120, price: 520, cost: 480 },
  { symbol: "00675L", name: "元大 00675L", qty: 80, price: 35, cost: 31 },
  { symbol: "2330.TW", name: "台積電 (TW)", qty: 10, price: 520, cost: 500 },
  { symbol: "AAPL", name: "Apple", qty: 12, price: 175, cost: 160 },
  { symbol: "GOOG", name: "Google", qty: 4, price: 140, cost: 120 }
]);

const cash = ref(20000);

/* small timeseries mock (30 days) */
const series30 = ref(generateSeries(30));
const volume = ref(12345);
const events = ref([
  { date: "2025-10-07", title: "加碼 00675L", detail: "$5,000" },
  { date: "2025-10-05", title: "台積電配息", detail: "$1,200" }
]);

const q = ref("");

/* --- helpers --- */
function formatCurrency(v) {
  if (v == null) return "-";
  return `$${Number(v).toLocaleString()}`;
}

function generateSeries(n = 30) {
  const arr = [];
  let v = 1000;
  for (let i = 0; i < n; i++) {
    v = v * (1 + (Math.random() - 0.48) * 0.02);
    arr.push(Number(v.toFixed(2)));
  }
  return arr;
}

/* --- derived --- */
const positionsWithValue = computed(() => {
  const tot = positions.value.reduce((s, p) => s + p.qty * p.price, 0);
  return positions.value.map((p) => {
    const value = p.qty * p.price;
    const percent = tot ? (value / tot) * 100 : 0;
    const pnl = (p.price - (p.cost || p.price)) * p.qty;
    return { ...p, value, percent, pnl, weight: percent };
  });
});

const positionsSorted = computed(() => positionsWithValue.value.slice().sort((a,b) => b.value - a.value));

const totalValue = computed(() => positionsWithValue.value.reduce((s,p) => s + p.value, 0));
const positionsCount = computed(() => positions.value.length);
const totalPercent = computed(() => {
  const totAsset = totalValue.value + cash.value;
  return totAsset ? (totalValue.value / totAsset) * 100 : 0;
});

/* simple metrics */
const todayPnL = computed(() => {
  // fake daily PnL by small change on each pos
  return positions.value.reduce((s, p) => {
    const delta = (Math.sin(p.qty + p.price) * 0.005);
    return s + p.qty * p.price * delta;
  }, 0);
});
const todayPnLPercent = computed(() => totalValue.value ? (todayPnL.value / totalValue.value) * 100 : 0);

/* week change (mock) */
const weekChangePercent = computed(() => {
  // use series30 diff
  const arr = series30.value;
  if (arr.length < 8) return 0;
  const last = arr[arr.length - 1];
  const prev = arr[arr.length - 8];
  return ((last - prev) / prev) * 100;
});

const lastChangePct = computed(() => {
  const arr = series30.value;
  if (arr.length < 2) return 0;
  const last = arr[arr.length - 1];
  const prev = arr[arr.length - 2];
  return ((last - prev) / prev) * 100;
});

/* --- donut segments (stroke-dashoffset technique on stacked circles) --- */
/* We'll compute relative offsets (percentage of circle) and apply as stroke-dashoffset.
   For simplicity we produce offsets array so each circle stroke shows segment length.
*/
const legendColors = ["#F59E0B", "#EF4444", "#3B82F6", "#60A5FA", "#FACC15", "#F87171"];

const segments = computed(() => {
  const total = totalValue.value || 1;
  let acc = 0;
  // Using 100 as full length (stroke-dasharray:100); dashoffset = 100 - (segmentPercent)
  return positionsSorted.value.map((p) => {
    const segPercent = (p.value / total) * 100;
    const offset = 100 - segPercent - acc;
    acc += segPercent;
    // clamp offset
    return { percent: segPercent, offset: Math.max(0, offset) };
  });
});

/* --- sparkline path helpers --- */
const sparkViewBox = computed(() => `0 0 ${series30.value.length} 100`);

const bigSparkPath = computed(() => {
  const arr = series30.value;
  if (!arr.length) return "";
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min || 1;
  const w = arr.length - 1;
  const points = arr.map((v, i) => {
    const x = i;
    const y = 100 - ((v - min) / range) * 90 - 5; // pad
    return `${i},${y}`;
  });
  return `M ${points.join(" L ")}`;
});

function toCSVRows() {
  const rows = [
    ["symbol","name","qty","price","value"]
  ];
  for (const p of positions.value) {
    rows.push([p.symbol, p.name, p.qty, p.price, p.qty * p.price]);
  }
  return rows;
}

/* --- actions --- */
function refreshPrices() {
  positions.value = positions.value.map(p => {
    const change = 1 + (Math.random() - 0.5) * 0.02;
    return { ...p, price: Number((p.price * change).toFixed(2)) };
  });
  series30.value = generateSeries(30);
  volume.value = Math.round(Math.random() * 20000 + 5000);
}

function randomizeAll() {
  positions.value.forEach((p, idx) => {
    positions.value[idx].price = Number((p.price * (1 + (Math.random()-0.5)*0.08)).toFixed(2));
  });
  series30.value = generateSeries(30);
  volume.value = Math.round(Math.random() * 20000 + 1000);
}

function exportCSV() {
  const rows = toCSVRows();
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `dashboard_positions_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function addRandomPosition() {
  const sample = ["MSFT","NFLX","TSMC","2330.TW","AAPL","00675L"];
  const s = sample[Math.floor(Math.random()*sample.length)];
  positions.value.push({
    symbol: s,
    name: s,
    qty: Math.floor(Math.random()*200)+1,
    price: Number((Math.random()*500+20).toFixed(2)),
    cost: Number((Math.random()*400+20).toFixed(2))
  });
}

function simulateTrade() {
  // add a trade event
  events.value.unshift({
    date: new Date().toLocaleDateString(),
    title: "模擬成交",
    detail: `隨機新增持倉 ${Math.floor(Math.random()*100)} 股`
  });
}

/* helpers for template exposure */
// const positionsCount = computed(() => positions.value.length);

/* expose for template */
</script>

<style scoped>
/* not overriding theme — use project's CSS variables and .card-theme */
/* small tweak so svg text inherits color variable if needed */
svg text { fill: var(--color-secondary); }
</style>
