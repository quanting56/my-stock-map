<template>
  <div class="p-6">
    <!-- page title + quick controls -->
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">Portfolio</h1>
        <div class="text-sm text-[color:var(--color-secondary)]">目前持倉總覽、權重與近期交易</div>
      </div>

      <div class="flex items-center gap-3">
        <button @click="refreshPrices" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white">更新價格</button>
        <button @click="exportCSV" class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]">匯出 CSV</button>
      </div>
    </header>

    <!-- summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">總市值</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ formatCurrency(totalValue) }}</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">今日損益</h4>
        <div :class="['text-2xl font-bold mt-2', todayPnL >= 0 ? 'text-[color:var(--color-line2)]' : 'text-[color:var(--color-line3)]']">
          {{ formatCurrency(todayPnL) }} ({{ todayPnLPercent.toFixed(2) }}%)
        </div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">持股數</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ positionsCount }}</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">現金可用</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ formatCurrency(cash) }}</div>
      </div>
    </div>

    <!-- main grid: pie + holdings | time series placeholder -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- left: pie + holdings table -->
      <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="font-medium text-[color:var(--color-secondary)]">持股比例</h3>
          <div class="text-xs text-[color:var(--color-secondary)]">總市值 {{ formatCurrency(totalValue) }}</div>
        </div>

        <!-- pie placeholder -->
        <div class="h-40 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-80">
          <!-- 這裡可換成 D3 / Chart -->
          [持股比例圖 / 環形圖]
        </div>

        <!-- legend -->
        <ul class="flex flex-wrap gap-2 text-sm mt-2">
          <li v-for="(p, i) in positionsSorted" :key="p.symbol" class="flex items-center gap-2">
            <span :class="['inline-block w-3 h-3 rounded-sm']" :style="{ backgroundColor: legendColors[i % legendColors.length] }"></span>
            <span class="text-[color:var(--color-secondary)]">{{ p.symbol }}</span>
            <span class="ml-1 font-medium text-[color:var(--color-primary)]">{{ p.percent.toFixed(1) }}%</span>
          </li>
        </ul>

        <!-- holdings table -->
        <div class="mt-3 border-t border-[color:var(--color-border)] pt-3">
          <table class="w-full text-sm">
            <thead class="text-[color:var(--color-secondary)]">
              <tr>
                <th class="text-left">股票</th>
                <th class="text-right">持有市值</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pos in positionsSorted" :key="pos.symbol" class="border-t border-[color:var(--color-border)]">
                <td class="py-2">
                  <div class="font-medium">{{ pos.symbol }}</div>
                  <div class="text-xs text-[color:var(--color-secondary)]">{{ pos.name }}</div>
                </td>
                <td class="py-2 text-right">
                  <div class="font-medium">{{ formatCurrency(pos.value) }}</div>
                  <div class="text-xs text-[color:var(--color-secondary)]">{{ pos.qty }} 股 • {{ pos.weight.toFixed(1) }}%</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- right: time series / chart placeholder -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium text-[color:var(--color-secondary)]">市值趨勢</div>
          <div class="text-xs text-[color:var(--color-secondary)]">Period: 30D</div>
        </div>

        <div class="h-72 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          <!-- 這裡可以放 Chart.js / D3 -->
          [市值 / 損益趨勢圖（placeholder）]
        </div>

        <!-- small stats under chart -->
        <div class="mt-3 grid grid-cols-2 gap-3 text-sm text-[color:var(--color-secondary)]">
          <div>平均成本: <span class="font-medium ml-2">{{ formatCurrency(avgCost) }}</span></div>
          <div class="text-right">持倉比: <span class="font-medium ml-2">{{ totalPercent.toFixed(1) }}%</span></div>
        </div>
      </div>
    </div>

    <!-- transactions / notes -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-theme rounded-2xl shadow p-4 overflow-auto">
        <h3 class="font-medium mb-3">交易紀錄</h3>
        <table class="w-full text-sm">
          <thead class="text-[color:var(--color-secondary)]">
            <tr>
              <th class="text-left">時間</th>
              <th class="text-left">股票</th>
              <th class="text-right">動作</th>
              <th class="text-right">數量</th>
              <th class="text-right">價格</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="trades.length === 0">
              <td colspan="5" class="py-6 text-center text-[color:var(--color-secondary)]">尚無交易</td>
            </tr>
            <tr v-for="(t, idx) in trades" :key="idx" class="border-t border-[color:var(--color-border)]">
              <td class="py-2">{{ t.time }}</td>
              <td>{{ t.symbol }}</td>
              <td class="text-right">{{ t.side }}</td>
              <td class="text-right">{{ t.qty }}</td>
              <td class="text-right">{{ formatCurrency(t.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">動作/快速小工具</h3>
        <div class="space-y-3 text-sm text-[color:var(--color-secondary)]">
          <div>
            <label class="block text-xs mb-1">新增持倉 (symbol)</label>
            <div class="flex gap-2">
              <input v-model="newPos.symbol" class="flex-1 px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" placeholder="例如 TSMC" />
              <input v-model.number="newPos.qty" type="number" class="w-28 px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" placeholder="數量" />
              <button @click="addPosition" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white">加入</button>
            </div>
          </div>

          <div>
            <button @click="simulateTrade" class="px-3 py-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] w-full">模擬一筆交易 (隨機)</button>
          </div>

          <div class="text-xs text-[color:var(--color-secondary)]">
            Tips: 這些都屬 mock 操作，真實專案應透過後端 API / 交易系統處理。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

/* mock 初始資料 */
const positions = ref([
  { symbol: "TSMC", name: "台積電", qty: 120, price: 520 },
  { symbol: "00675L", name: "元大孖展", qty: 80, price: 35 },
  { symbol: "2330.TW", name: "台積電 (TW)", qty: 10, price: 520 }
]);

const trades = ref([
  { time: new Date().toLocaleString(), symbol: "TSMC", side: "Buy", qty: 50, price: 510 },
  { time: new Date(Date.now() - 3600 * 1000 * 24).toLocaleString(), symbol: "00675L", side: "Buy", qty: 80, price: 30 }
]);

const cash = ref(20000);

/* helpers */
const legendColors = ["#F59E0B", "#EF4444", "#3B82F6", "#60A5FA", "#FACC15", "#F87171"];

function formatCurrency(v) {
  if (v == null) return "-";
  return `$${Number(v).toLocaleString()}`;
}

/* derived numbers */
const totalValue = computed(() => {
  return positions.value.reduce((s, p) => s + p.qty * p.price, 0);
});

const positionsWithValue = computed(() => {
  const tot = totalValue.value || 1;
  return positions.value.map((p) => {
    const value = p.qty * p.price;
    return {
      ...p,
      value,
      percent: (value / tot) * 100,
      weight: (value / (tot + cash.value)) * 100
    };
  });
});

const positionsSorted = computed(() => {
  return positionsWithValue.value.slice().sort((a, b) => b.value - a.value);
});

const positionsCount = computed(() => positions.value.length);
const totalPercent = computed(() => {
  // holdings占總資產比 (持倉 / (持倉+cash))
  const tot = totalValue.value + cash.value || 1;
  return (totalValue.value / tot) * 100;
});

/* simple metrics (mock today's pnl) */
const todayPnL = computed(() => {
  // 用 (price * qty) * small random delta 模擬
  return positions.value.reduce((s, p) => {
    const delta = (Math.sin(p.qty + p.price) * 0.005); // deterministic-ish small change
    return s + p.qty * p.price * delta;
  }, 0);
});
const todayPnLPercent = computed(() => {
  return totalValue.value ? (todayPnL.value / totalValue.value) * 100 : 0;
});

/* average cost */
const avgCost = computed(() => {
  const totQty = positions.value.reduce((s, p) => s + p.qty, 0) || 1;
  const totCost = positions.value.reduce((s, p) => s + p.qty * p.price, 0);
  return totCost / totQty;
});

/* interactions */
function refreshPrices() {
  // mock：稍微改變每檔價格
  positions.value = positions.value.map((p) => {
    const change = 1 + (Math.random() - 0.5) * 0.02;
    return { ...p, price: Number((p.price * change).toFixed(2)) };
  });
}

function exportCSV() {
  const rows = [
    ["symbol", "name", "qty", "price", "value"],
    ...positions.value.map((p) => [p.symbol, p.name, p.qty, p.price, p.qty * p.price])
  ];
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `portfolio_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const newPos = reactive({ symbol: "", qty: 0, price: 0 });
function addPosition() {
  if (!newPos.symbol || newPos.qty <= 0) return;
  // price 用最新價格或估價
  positions.value.push({
    symbol: newPos.symbol.toUpperCase(),
    name: newPos.symbol.toUpperCase(),
    qty: Number(newPos.qty),
    price: Number(newPos.price) || 1
  });
  newPos.symbol = "";
  newPos.qty = 0;
  newPos.price = 0;
}

function simulateTrade() {
  // pick a random pos or create one
  const symbol = positions.value.length ? positions.value[Math.floor(Math.random() * positions.value.length)].symbol : "TBD";
  const price = Math.round((Math.random() * 500 + 10) * 100) / 100;
  const qty = Math.floor(Math.random() * 50) + 1;
  trades.value.unshift({
    time: new Date().toLocaleString(),
    symbol,
    side: Math.random() > 0.5 ? "Buy" : "Sell",
    qty,
    price
  });
}

/* expose for template */
</script>

<style scoped>
/* 主要視覺元素使用全域 card-theme 與 CSS 變數，不另外覆寫 */
</style>
