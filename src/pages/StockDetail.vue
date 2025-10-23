<template>
  <div class="p-6">
    <!-- 頁面標題：Ticker + price -->
    <header class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <div class="flex items-center gap-3">
          <div class="text-3xl font-bold text-[color:var(--color-primary)]">{{ ticker }}</div>
          <div class="text-sm text-[color:var(--color-secondary)]">{{ companyName }}</div>
          <div class="ml-3 px-2 py-0.5 rounded-md text-xs font-medium bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
            交易代號
          </div>
        </div>

        <div class="mt-2 flex items-baseline gap-4">
          <div class="text-2xl font-bold text-[color:var(--color-primary)]">${{ latestPrice.toLocaleString() }}</div>
          <div :class="priceChangeClass" class="text-sm font-medium">
            {{ priceChangeSign }}{{ priceChangeAbs }} ({{ priceChangePct }}%)
          </div>
          <div class="text-xs text-[color:var(--color-secondary)]">成交量 {{ latestVolume.toLocaleString() }}</div>
        </div>
      </div>

      <!-- timeframe / 行為按鈕 -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-2 bg-[color:var(--color-card)] border border-[color:var(--color-border)] rounded-md p-1">
          <button
            v-for="tf in timeframes"
            :key="tf"
            @click="currentTimeframe = tf"
            :class="[
              'px-3 py-1 rounded-md text-sm transition',
              currentTimeframe === tf ? 'bg-[color:var(--color-primary)] text-white' : ''
            ]"
          >
            {{ tf }}
          </button>
        </div>

        <button class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm">新增觀察</button>
        <!-- <button class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm">下單</button> -->
      </div>
    </header>

    <!-- 主要內容：Chart + side widgets -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <!-- Chart 區（大） -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="font-medium text-[color:var(--color-secondary)]">價格走勢（{{ currentTimeframe }}）</div>
          <div class="text-xs text-[color:var(--color-secondary)]">最後更新：{{ lastUpdated }}</div>
        </div>

        <!-- 這裡放你之後要換成 Chart 的容器 -->
        <div class="h-72 md:h-96 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          [Price chart placeholder — use D3 / Chart.js here]
        </div>

        <!-- 下方：技術指標小卡 -->
        <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div v-for="(v, k) in indicatorSummary" :key="k" class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-center">
            <div class="text-xs text-[color:var(--color-secondary)]">{{ k }}</div>
            <div class="text-lg font-semibold mt-1">{{ v }}</div>
          </div>
        </div>
      </div>

      <!-- 右側：Positions / quick trade -->
      <aside class="card-theme rounded-2xl shadow p-4 space-y-4">

        <div>
          <h3 class="font-medium text-[color:var(--color-primary)]">基本面摘要</h3>
          <ul class="text-sm space-y-1 text-[color:var(--color-text)] mt-2">
            <li>本益比（PE）：<span class="font-medium text-[color:var(--color-primary)]">22.4</span></li>
            <li>股價淨值比（PB）：<span class="font-medium text-[color:var(--color-primary)]">5.6</span></li>
            <li>殖利率：<span class="font-medium text-[color:var(--color-primary)]">1.9%</span></li>
            <li>股本：<span class="font-medium text-[color:var(--color-primary)]">2,590 億</span></li>
            <li>EPS（近四季）：<span class="font-medium text-[color:var(--color-primary)]">36.8</span></li>
          </ul>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h3 class="font-medium text-[color:var(--color-primary)]">個人持倉快速摘要</h3>
          <ul class="text-sm space-y-1 text-[color:var(--color-secondary)] mt-2">
            <li>成本： <span class="font-medium">${{ position.cost.toLocaleString() }}</span></li>
            <li>持股數： <span class="font-medium">{{ position.shares }}</span></li>
            <li>損益： <span :class="positionPLClass" class="font-medium">${{ positionPL }} (-6.21%)</span></li>
          </ul>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h4 class="font-medium mb-2">更多</h4>
          <div class="space-y-2.5">
            <button @click="copyTicker" class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm">複製代號 2330.TW</button>
            <button class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm">查看 PTT 討論這家公司的文章</button>
            <button class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-sm">查看 Dcard 討論這家公司的文章</button>
          </div>
        </div>
      </aside>
    </div>

    <!-- 下方區塊：成交明細 / 相關新聞 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">持有時間表</h3>
        <div class="h-64 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          [個人持有股數折線圖區域 — use D3.js here]
        </div>
      </div>

      <div class="card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">相關新聞 / 註記</h3>
        <ul class="space-y-3 text-sm">
          <li v-for="(n, i) in notes" :key="i" class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
            <div class="text-xs text-[color:var(--color-secondary)]">{{ n.date }}</div>
            <div class="mt-1">{{ n.text }}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useUIThemeStore } from "@/store/theme";

const uiTheme = useUIThemeStore();

// route param（若你未用 router，這段可刪）
// const route = useRoute();
// const tickerParam = route?.params?.ticker || null;

// 樣式化 / 假資料
const ticker = ref("2330.TW");
// const ticker = ref(tickerParam || "2330.TW");  // 若你用 router，上行改這行
const companyName = ref("台積電｜臺灣市值第 1 大公司｜權重股");
const latestPrice = ref(520);
const latestVolume = ref(123456);
const lastUpdated = ref(new Date().toLocaleString());

const priceChangePct = ref(-1.28);
const priceChangeAbs = ref((latestPrice.value * priceChangePct.value / 100).toFixed(2));
const priceChangeSign = computed(() => (priceChangePct.value >= 0 ? "+" : ""));
const priceChangeClass = computed(() => (priceChangePct.value >= 0 ? "text-green-600" : "text-red-500"));

// timeframes
const timeframes = ["1D", "5D", "1M", "3M", "1Y"];
const currentTimeframe = ref("1M");

// indicators (mock)
const indicatorSummary = reactive({
  "MA(20)": "512",
  "MA(50)": "498",
  "RSI": "62",
  "Vol Avg": "98k"
});

// position (mock)
const position = reactive({
  shares: 120,
  cost: 450,
});

const positionPL = computed(() => {
  const pl = (latestPrice.value - position.cost) * position.shares;
  return pl.toFixed(0);
});
const positionPLClass = computed(() => (parseFloat(positionPL.value) >= 0 ? "text-green-600" : "text-red-500"));

// mock trades / notes
const recentTrades = ref([
  { time: "2025-10-10 09:05", action: "買入", price: 512, qty: 1 },
  { time: "2025-10-08 13:22", action: "賣出", price: 530, qty: 2 },
  { time: "2025-10-07 10:11", action: "買入", price: 495, qty: 3 }
]);

const notes = ref([
  { date: "2025-10-08", text: "法說會預告 - 影響明日盤勢" },
  { date: "2025-09-30", text: "公告除息" }
]);

// quick order
const order = reactive({
  side: "buy",
  qty: 1
});

function mockOrder() {
  alert(`模擬下單：${order.side.toUpperCase()} ${order.qty} 張 (${ticker.value})`);
}

// copy ticker
function copyTicker() {
  navigator.clipboard?.writeText(ticker.value)
    .then(() => alert("已複製代號"))
    .catch(() => alert("複製失敗"));
}
</script>

<style scoped>
/* 留空，整個專案用全域變數與 tailwind utilities 控制樣式 */
</style>
