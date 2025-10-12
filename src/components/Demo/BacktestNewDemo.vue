<template>
  <div class="p-6">
    <!-- header / controls -->
    <header class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">🔍 回測模組</h1>
        <div class="text-sm text-[color:var(--color-secondary)]">模擬策略表現並檢視績效指標</div>
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <select v-model="params.strategy"
                class="px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
        >
          <option v-for="s in strategies" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>

        <input type="date" v-model="params.startDate"
               class="px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
        />
        <input type="date" v-model="params.endDate"
               class="px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
        />

        <input type="number" v-model.number="params.initialCapital" min="1"
               class="w-32 px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
        />

        <button
          @click="runBacktest"
          :disabled="running"
          class="px-4 py-1 rounded-md bg-[color:var(--color-primary)] text-white disabled:opacity-50"
        >
          {{ running ? "執行中..." : "執行回測" }}
        </button>

        <button @click="reset" class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)]">
          重設
        </button>
      </div>
    </header>

    <!-- summary cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">總報酬</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ totalReturnLabel }}</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">年化 (CAGR)</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-line2)]">{{ cagrLabel }}</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">最大回撤</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-line3)]">{{ maxDrawdownLabel }}</div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h4 class="text-xs text-[color:var(--color-secondary)]">交易次數</h4>
        <div class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">{{ trades.length }}</div>
      </div>
    </div>

    <!-- main grid: equity curve + sidebar -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- equity / chart -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium text-[color:var(--color-secondary)]">權益曲線 ({{ params.strategy }})</div>
          <div class="text-xs text-[color:var(--color-secondary)]">資本: {{ formatCurrency(params.initialCapital) }}</div>
        </div>

        <!-- placeholder for chart -->
        <div class="h-64 md:h-80 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          <!-- 你可以把這裡換成 D3 / Chart.js 組件 -->
          <template v-if="equity.length === 0">
            尚未執行回測
          </template>
          <template v-else>
            <div class="w-full h-full flex flex-col">
              <div class="flex-1 flex items-end px-3 py-2">
                <!-- tiny ascii-ish visualisation as fallback -->
                <div class="w-full flex items-end gap-1">
                  <div
                    v-for="(v, i) in equityNormalized"
                    :key="i"
                    :title="formatCurrency(equity[i])"
                    :style="{ height: `${v * 100}%` }"
                    class="flex-1 rounded-sm bg-gradient-to-t from-[color:var(--color-primary)] to-transparent"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- small table of equity head/tail -->
        <div class="mt-3 grid grid-cols-2 gap-3 text-xs text-[color:var(--color-secondary)]">
          <div>開始: {{ equity[0] ? formatCurrency(equity[0]) : "-" }}</div>
          <div class="text-right">結束: {{ equityLast ? formatCurrency(equityLast) : "-" }}</div>
        </div>
      </div>

      <!-- right sidebar: metrics / quick info -->
      <aside class="card-theme rounded-2xl shadow p-4 space-y-4">
        <div>
          <h3 class="font-medium text-[color:var(--color-primary)]">績效指標</h3>
          <ul class="mt-2 text-sm text-[color:var(--color-secondary)] space-y-2">
            <li>年化報酬 (CAGR): <span class="font-medium ml-2">{{ cagrLabel }}</span></li>
            <li>總報酬: <span class="font-medium ml-2">{{ totalReturnLabel }}</span></li>
            <li>最大回撤: <span class="font-medium ml-2">{{ maxDrawdownLabel }}</span></li>
            <li>夏普比率 (估): <span class="font-medium ml-2">{{ sharpeLabel }}</span></li>
          </ul>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h4 class="font-medium mb-2">策略參數</h4>
          <div class="text-sm text-[color:var(--color-secondary)] space-y-1">
            <div>策略：<span class="font-medium ml-2">{{ params.strategy }}</span></div>
            <div>開始：<span class="font-medium ml-2">{{ params.startDate }}</span></div>
            <div>結束：<span class="font-medium ml-2">{{ params.endDate }}</span></div>
            <div>初始資金：<span class="font-medium ml-2">{{ formatCurrency(params.initialCapital) }}</span></div>
          </div>
        </div>

        <div>
          <button @click="exportResults" class="w-full px-3 py-2 rounded-md bg-[color:var(--color-primary)] text-white">匯出結果 (JSON)</button>
        </div>
      </aside>
    </div>

    <!-- bottom: trades / logs -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-theme rounded-2xl shadow p-4 overflow-auto">
        <h3 class="font-medium mb-3">交易紀錄 (模擬)</h3>
        <table class="w-full text-sm">
          <thead class="text-[color:var(--color-secondary)]">
            <tr>
              <th class="text-left">時間</th>
              <th class="text-left">動作</th>
              <th class="text-right">價格</th>
              <th class="text-right">數量</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="trades.length === 0">
              <td colspan="4" class="py-4 text-center text-[color:var(--color-secondary)]">尚無交易</td>
            </tr>
            <tr v-for="(t, idx) in trades" :key="idx" class="border-t border-[color:var(--color-border)]">
              <td class="py-2">{{ t.time }}</td>
              <td>{{ t.side }}</td>
              <td class="text-right">{{ formatCurrency(t.price) }}</td>
              <td class="text-right">{{ t.qty }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">計算日誌 / 註記</h3>
        <ul class="text-sm text-[color:var(--color-secondary)] space-y-2">
          <li v-for="(l, i) in logs" :key="i" class="p-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
            {{ l }}
          </li>
          <li v-if="logs.length === 0" class="text-[color:var(--color-secondary)]">目前無紀錄</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";

/* strategies 列表（示範） */
const strategies = [
  { id: "ma-cross", name: "均線交叉 (MA Cross)" },
  { id: "momentum", name: "Momentum" },
  { id: "mean-revert", name: "均值回歸" }
];

/* 回測參數 */
const params = reactive({
  strategy: strategies[0].id,
  startDate: new Date(new Date().getFullYear() - 1, 0, 1).toISOString().slice(0, 10), // 去年年初
  endDate: new Date().toISOString().slice(0, 10),
  initialCapital: 100000
});

const running = ref(false);
const equity = ref([]);        // array of equity values over time
const trades = ref([]);        // mock trades
const logs = ref([]);

/* helpers */
function formatCurrency(v) {
  if (v == null) return "-";
  return `$${Number(v).toLocaleString()}`;
}

/* metrics computed */
const equityLast = computed(() => (equity.value.length ? equity.value[equity.value.length - 1] : null));
const totalReturn = computed(() => {
  if (!equity.value.length) return 0;
  return ((equityLast.value - params.initialCapital) / params.initialCapital) * 100;
});
const totalReturnLabel = computed(() => `${totalReturn.value.toFixed(2)}%`);
const cagr = computed(() => {
  if (!equity.value.length) return 0;
  // 簡單估算：以 252 trading days/year 假設，或根據日期改良
  const years = Math.max(0.0001, (new Date(params.endDate) - new Date(params.startDate)) / (1000 * 60 * 60 * 24 * 365));
  return (Math.pow((equityLast.value / params.initialCapital), 1 / years) - 1) * 100;
});
const cagrLabel = computed(() => (isFinite(cagr.value) ? `${cagr.value.toFixed(2)}%` : "-"));
const maxDrawdown = computed(() => {
  if (!equity.value.length) return 0;
  let peak = -Infinity;
  let maxDD = 0;
  for (let v of equity.value) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD * 100;
});
const maxDrawdownLabel = computed(() => `${maxDrawdown.value.toFixed(2)}%`);

/* very rough sharpe estimate */
const sharpeLabel = computed(() => {
  if (equity.value.length < 2) return "-";
  // compute daily returns from equity array
  const rets = [];
  for (let i = 1; i < equity.value.length; i++) {
    rets.push((equity.value[i] / equity.value[i - 1]) - 1);
  }
  const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.map(r => (r - avg) ** 2).reduce((a, b) => a + b, 0) / rets.length);
  if (sd === 0) return "-";
  const sharpe = (avg / sd) * Math.sqrt(252); // annualized
  return sharpe.toFixed(2);
});

/* normalize equity for tiny visual bars */
const equityNormalized = computed(() => {
  if (!equity.value.length) return [];
  const min = Math.min(...equity.value);
  const max = Math.max(...equity.value);
  const range = Math.max(1, max - min);
  return equity.value.map(v => (v - min) / range);
});

/* runBacktest: mock simulation */
function runBacktest() {
  running.value = true;
  logs.value = [`開始執行回測：${params.strategy} (${params.startDate} → ${params.endDate})`];
  trades.value = [];
  equity.value = [];

  // 模擬：建立 N 點 equity，並生成一些 trades
  setTimeout(() => {
    const points = 60;
    let eq = params.initialCapital;
    const arr = [];
    for (let i = 0; i < points; i++) {
      // small random walk
      const noise = (Math.random() - 0.48) * 0.02; // +-2%
      eq = Math.max(100, eq * (1 + noise));
      arr.push(Number(eq.toFixed(2)));
      // occasionally push a trade
      if (Math.random() > 0.85) {
        trades.value.push({
          time: new Date(Date.now() - (points - i) * 24 * 3600 * 1000).toLocaleString(),
          side: Math.random() > 0.5 ? "Buy" : "Sell",
          price: Number((100 + Math.random() * 50).toFixed(2)),
          qty: Math.floor(Math.random() * 5) + 1
        });
      }
    }
    equity.value = arr;
    logs.value.push(`完成模擬：產生 ${arr.length} 個 equity 點與 ${trades.value.length} 筆交易`);
    running.value = false;
  }, 800); // 模擬 800ms 延遲
}

function reset() {
  running.value = false;
  equity.value = [];
  trades.value = [];
  logs.value = [];
}

/* export results */
function exportResults() {
  const payload = {
    params: JSON.parse(JSON.stringify(params)),
    equity: equity.value,
    trades: trades.value,
    metrics: {
      totalReturn: totalReturn.value,
      cagr: cagr.value,
      maxDrawdown: maxDrawdown.value,
      sharpe: sharpeLabel.value
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backtest_${params.strategy}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
/* page 使用全域 card-theme / color 變數，這裡不另行覆寫 */
</style>
