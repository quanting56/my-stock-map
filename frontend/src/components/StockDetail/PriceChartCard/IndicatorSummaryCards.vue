<template>
  <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div
      v-for="(v, k) in indicatorSummary"
      :key="k"
      class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-center"
    >
      <div class="text-xs text-[color:var(--color-secondary)]">{{ k }}</div>
      <div class="text-lg font-semibold mt-1">{{ v }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  indicatorSummaryData: {  // 父層傳入：已依 timeframe 篩好的序列資料 StockBar[]
    type: Array,
    default: () => []
  }
});

const indicatorSummary = ref({
  "MA(20)": "-",
  "MA(50)": "-",
  "RSI": "-",
  "Vol Avg": "-"
});


// 計算工具（樣本不足就回傳 null）
// 取「最後 n 個」的平均（若 arr 長度 < n，回傳 null）
function meanLast(arr, n) {
  if (!Array.isArray(arr) || arr.length < n) return null;
  let sum = 0;
  for (let i = arr.length - n; i < arr.length; i++) sum += arr[i];
  return sum / n;
}

// 整個區間的平均
function mean(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const valid = arr.filter(v => Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
};

const fmt = (n, d = 2) => (n == null || Number.isNaN(n)) ? "-" : Number(n).toFixed(d);

function fmtVol(n) {
  if (n == null) return "-";
  if (n >= 1e9) return (n/1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n/1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n/1e3).toFixed(2) + "k";
  return Math.round(n).toLocaleString();
};


// RSI（Wilder smoothing）
function calcRSI14Strict(rows) {
  const period = 14;
  if (!rows) return null;
  const closes = rows.map(r => r.close);
  if (closes.length < period + 1) return null; // 需要至少 15 根（含 1 根起始 + 14 根初始化）

  // 初始化：前 period 根的等權平均
  let gainSum = 0, lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gainSum += diff; else lossSum -= diff;
  };
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  // Wilder 平滑
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  };

  if (avgGain === 0 && avgLoss === 0) return 50; // 完全無波動
  if (avgLoss === 0) return 100;                  // 無損失
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

function recompute(rows) {
  if (!rows || rows.length === 0) {
    indicatorSummary.value = { "MA(20)": "-", "MA(50)": "-", "RSI": "-", "Vol Avg": "-" };
    return;
  }
  const closes = rows.map((r) => r.close);
  const vols = rows.map((r) => r.volume);

  const ma20 = meanLast(closes, 20);
  const ma50 = meanLast(closes, 50);
  const rsi14 = calcRSI14Strict(rows);
  const vAvgRange = mean(vols.filter(v => v > 0));

  indicatorSummary.value = {
    "MA(20)": fmt(ma20),
    "MA(50)": fmt(ma50),
    RSI: fmt(rsi14),
    "Vol Avg": fmtVol(vAvgRange)
  };
}

// 當父層 timeframe 改變導致 indicatorSummaryData 變動時，重算
watch(
  () => props.indicatorSummaryData,
  (rows) => recompute(rows),
  { immediate: true, deep: true }
);
</script>

<style scoped></style>
