<template>
  <LoadingModal :open="isLoading" message="資料載入運算中"></LoadingModal>
  <!-- 參數設定區 -->
  <div class="card-theme rounded-2xl shadow p-6 space-y-4">
    <h3 class="font-medium">⚙️ 回測參數設定</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">股票代號</label>
        <input
          type="text"
          placeholder="例如：2330"
          v-model.trim="form.symbol"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">起始日期</label>
        <input
          type="date"
          v-model="form.start"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">結束日期</label>
        <input
          type="date"
          v-model="form.end"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">初始資金</label>
        <input
          type="number"
          placeholder="例如：100000"
          v-model.number="form.initialCash"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">策略選擇</label>
        <select
          v-model="form.strategy"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        >
          <option>單筆買入</option>
          <option>定期定額</option>
          <option>均線交叉</option>
          <option>RSI 超買超賣</option>
        </select>
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">每次投入金額</label>
        <input
          type="number"
          placeholder="例如：5000"
          v-model.number="form.dcaAmount"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button
        @click="runBacktest"
        class="px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition cursor-pointer"
      >
        ▶️ 開始回測
      </button>
    </div>
  </div>

  <!-- 走勢圖 + 總資產變化 -->
  <SingleAssetBacktestChart
    :series="series"
    :kpis="kpis"
  ></SingleAssetBacktestChart>
</template>

<script setup>
import LoadingModal from "@/components/Common/LoadingModal.vue";
import SingleAssetBacktestChart from "@/components/Backtest/SingleAssetBacktest/SingleAssetBacktestChart.vue";

import { reactive, ref } from "vue";
import { fetchStockSeries } from "@/api/stocksApi.js";

const form = reactive({
  symbol: "2330",
  start: "2020-09-01",  // "YYYY-MM-DD"
  end:   "",
  strategy: "單筆買入",
  dcaAmount: 5000,
  initialCash: 100000,
});

// Chart 需要的資料接口
const series = ref([]);  // [{date: Date, equity: number}]  回測資料
const kpis = ref({
  totalReturn: 0.127,
  maxDrawdown: -0.089,
  cagr: 0.063,
  winRate: 0.61
});

// UI 狀態（不改版面）
const isLoading = ref(false);


// ===========================
// 小工具
// ===========================
const byDateAsc = (a, b) => +a.date - +b.date;
const last = (arr) => arr[arr.length - 1];
const days = (a, b)=> Math.abs((+b - +a) / 86400000);



// ===========================
// 技術指標
// ===========================
// 簡單移動平均 SMA = N日收盤價的總和 / N
function SMA(values, n){
  const out = [];
  let sum = 0;
  const q = [];
  for (let i = 0; i < values.length; i++) {
    sum += values[i]; q.push(values[i]);
    if (q.length > n) sum -= q.shift();
    out.push(q.length === n ? sum/n : null);
  }
  return out;
}


// 相對強弱指數 RSI = (1 - (1 / (1 + RS))) * 100%
function RSI(closes, n = 14) {
  const out = Array(closes.length).fill(null);

  let sumGain = 0, sumLoss = 0;
  for (let i = 1; i <= n && i < closes.length; i++) {
    // 先計算前 n 根的「上漲總和/下跌總和」
    const ch = closes[i] - closes[i - 1];
    if (ch > 0) {
      sumGain += ch;
    } else {
      sumLoss += -ch;
    };

    if (i === n) {
      // 轉成「平均上漲/平均下跌」（這步是關鍵）
      let avgGain = sumGain / n;
      let avgLoss = sumLoss / n;

      // 先產生第 n 根 RSI
      const rs0 = avgGain / Math.max(avgLoss, 1e-12);
      out[i] = 100 - 100 / (1 + rs0);

      // 後續用 Wilder 平滑遞推
      for (let k = n + 1; k < closes.length; k++) {
        const ch2 = closes[k] - closes[k - 1];
        const g = ch2 > 0 ? ch2 : 0;
        const l = ch2 < 0 ? -ch2 : 0;
        avgGain = (avgGain * (n - 1) + g) / n;
        avgLoss = (avgLoss * (n - 1) + l) / n;
        const rs = avgGain / Math.max(avgLoss, 1e-12);
        out[k] = 100 - 100 / (1 + rs);
      }
      break;  // 已經把後面都算完，可以跳出外層 for
    }
  }
  return out;
}


// KPI 計算（資產淨值 equitySeries, 初始現金 initialCash）
function computeKpis(equitySeries, initialCash){
  if (!equitySeries.length) {
    return {
      totalReturn: null,
      maxDrawdown: null,
      cagr: null,
      winRate: null
    };
  };
  
  // 計算「最大回撤」
  const eq = equitySeries.map(d => d.equity);  // 每個點的資產淨值
  const peak = [];  // 一路往前看的「歷史最高淨值」累積陣列
  let mdd = 0, p = 0;
  for (const v of eq) {
    p = Math.max(p, v);  // 更新歷史高點
    peak.push(p);
    mdd = Math.min(mdd, v / p - 1);  // 以目前高點為基準看跌幅，保留最深的那次
  }
  const tr = eq[eq.length - 1] / initialCash - 1;  // 總報酬率（期末淨值 / 初始現金 - 1）
  const tYears = Math.max(  // 期間長度（單位：年）
    days(equitySeries[0].date, last(equitySeries).date) / 365.25,
    1 / 365.25  // 保底至少一天
  );

  // 年化報酬率
  const cagr = Math.pow(eq[eq.length - 1] / initialCash, 1 / tYears) - 1;

  // 勝率（以「日增長的 equity」為勝率）
  let win = 0, cnt = 0;
  for(let i = 1; i < eq.length; i++) {
    if (Number.isFinite(eq[i]) && Number.isFinite(eq[i - 1])) {
      cnt++;
      if (eq[i] >= eq[i - 1]) win++;
    }
  }
  const winRate = cnt ? win / cnt : null;
  return {
    totalReturn: tr,   // 總報酬率
    maxDrawdown: mdd,  // 最大回撤
    cagr,              // 年化報酬率
    winRate            // 勝率
  };
}



// ===========================
// 三種策略
// （全部用「不做空、滿倉/全現金」的最小可用版本）
// ===========================
// 買進並持有（作為基底，並為「單筆買入」預設）
function runBuyHold(rows, initialCash){
  if (!rows.length) return [];
  const first = rows[0].close;
  const shares = initialCash / first;
  return rows.map(r => ({ date:r.date, equity: shares * r.close }));
}


// 定期定額 DCA（每月第一個交易日投入 dcaAmount；沒錢就跳過）
function runDCA(rows, initialCash, dcaAmount){
  let cash = initialCash;   // 累積現金
  let shares = 0;           // 累積股數
  const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  let lastYm = "";          // 最近一次下單所屬的 年-月
  const out = [];

  for (const r of rows) {        // rows: 時序資料 [{date, close}, ...]
    const curYm = ym(r.date);    // 取出當前 K 棒的 年-月 (e.g. "2025-10")

    // 判斷「是否進入新月份」→ 視為該月第一個交易日
    if (curYm !== lastYm && cash >= dcaAmount) {  // 每換到新月份的第一根
      const buyShares = dcaAmount / r.close;      // 當期買進股數
      shares += buyShares;
      cash   -= dcaAmount;
      lastYm = curYm;                             // 記錄本月已經買過
    }

    // 每一根K棒都輸出當下的 資產淨值 equity
    out.push({
      date: r.date,
      equity: shares * r.close + cash             // 權益 = 股票市值 + 現金餘額
    });
  }
  return out;
}


// 均線交叉（短>長 → 滿倉；短<長 → 現金）
function runMaCross(rows, initialCash, s = 20, l = 60) {
  if (!rows.length) return [];

  const closes = rows.map((r) => r.close);  // 取出收盤價序列
  const maS = SMA(closes, s);               // 計算「短天期」簡單移動平均
  const maL = SMA(closes, l);               // 計算「長天期」簡單移動平均

  // 交易狀態
  let holding = false;                      // 目前是否「持有」中
  let shares = 0;                           // 目前持股數（滿倉 → 有股，空手 → 0）
  let cash = initialCash;                   // 現金部位
  const out=[];                             // 權益曲線輸出 [{date, equity}, ...]

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const sOk = maS[i] != null && maL[i] != null;  // 兩條均線都已經有值
    const long = sOk && maS[i] > maL[i];    // 策略訊號（短期均線 > 長期均線）

    // 進場條件：原本沒持有、且現在是 long（黃金交叉或本來就多頭區間）
    if (!holding && long) {
      shares = cash / r.close;              // 用所有現金換成股數（滿倉）
      cash = 0;                             // 現金清零
      holding = true;                       // 標記為持有狀態
    }

    // 出場條件：原本持有、且現在不是 long（死亡交叉或空頭區間）
    if (holding && !long) {
      cash = shares * r.close;              // 全部市價賣出換回現金
      shares = 0;                           // 股數清零
      holding = false;                      // 標記為空手狀態
    }
    
    out.push({
      date: r.date,
      equity: holding ? shares * r.close : cash
    });
  }

  return out;  // 回傳整段權益序列
}


// RSI Swing 策略（<30 全倉買；>70 全數賣；區間內維持）
function runRsiSwing(rows, initialCash, lower=30, upper=70) {
  if (!rows.length) return [];

  const closes = rows.map(r => r.close);   // 取出所有收盤價
  const rsi = RSI(closes, 14);

  let holding = false;                     // 目前是否「持有」中
  let shares = 0;                          // 目前持股數
  let cash = initialCash;                  // 目前現金餘額

  const out = [];                          // 權益曲線輸出 [{ date, equity }, ...]
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];                     // 當根 K 線（含 date & close）
    const v = rsi[i];                      // 當根的 RSI 值（前 13 根通常是 null）
    
    if (v != null) {
      // 進場條件：尚未持有，且 RSI 低於下界（超賣） → 滿倉買入
      if (!holding && v < lower) {
        shares = cash / r.close;           // 所有現金換成股數
        cash = 0;                          // 現金清零
        holding = true;                    // 標記為持有狀態
      }

      // 出場條件：正在持有，且 RSI 高於上界（超買） → 全部賣出
      if (holding && v > upper) {
        cash = shares * r.close;           // 全部賣出換回現金
        shares = 0;                        // 股數清零
        holding = false;                   // 標記為空手狀態
      }

      // 若 v 介於 [lower, upper]，什麼都不做 → 維持原部位（holding 不變）
    }

    out.push({
      date: r.date,
      equity: holding ? shares * r.close : cash  // 當日權益：持股狀態下「股數×收盤價」；空手狀態下「現金」
    });
  }
  return out;  // 回傳整段權益序列
}


// 日期轉 query 參數
function toRangeParams(start, end){
  const p = {};
  if (start) {
    const d = new Date(start);
    p.startYear = d.getFullYear();
    p.startMonth = d.getMonth() + 1;
  }
  if (end) {
    const d = new Date(end);
    p.endYear = d.getFullYear();
    p.endMonth = d.getMonth() + 1;
  }
  return p;
}

async function runBacktest() {
  isLoading.value = true;

  try{
    const symbol = String(form.symbol || "").trim();  // 取出表單的股票代號

    // 驗證
    if (!/^\d{4,6}[A-Z]{0,2}$/.test(symbol)) throw new Error("請輸入正確的股票代碼（例如 2330）");

    // 抓價（rows: {date: Date, close: number, ...} 已排序）
    const rows = await fetchStockSeries(symbol, toRangeParams(form.start, form.end));
    if (!rows.length) throw new Error("查無價格資料");

    // 跑策略 → 得到權益曲線 equity curve
    let eq = [];
    if (form.strategy === "定期定額"){
      eq = runDCA(rows, form.initialCash, form.dcaAmount);   // f(資料, 初始資金, 每期投入資金)
    } else if (form.strategy === "均線交叉"){
      eq = runMaCross(rows, form.initialCash, 20, 60);       // f(資料, 初始資金, 短天期MA的天數, 長天期MA的天數)
    } else if (form.strategy === "RSI 超買超賣"){
      eq = runRsiSwing(rows, form.initialCash, 30, 70);      // f(資料, 初始資金, 超賣閾值, 超買閾值)
    } else {
      // 單筆買入（暫時用 「Buy & Hold」 當兜底）
      eq = runBuyHold(rows, form.initialCash);               // f(資料, 初始資金)
    }

    // 準備圖表資料：series 與 KPI
    series.value = eq.sort(byDateAsc);  // [{date, equity}]，保險起見再排序一次
    kpis.value   = computeKpis(series.value, form.initialCash);
  } catch (e) {
    console.error(e);
    alert(`錯誤原因：${e}`);
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped></style>
