import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 小工具：UI 格式化（顯示用，資料請存 raw）
// 貨幣格式、百分比位數
export const useDisplayFormatStore = defineStore("displayFormat", () => {
  // 貨幣格式
  const currency = ref("TWD");            // 例：'TWD', 'USD', 'JPY'
  const useGrouping = ref(true);          // 是否使用千分位
  const compact = ref(false);             // 是否用簡寫（1.2K、3.4M）

  // 顯示小數位數
  const currencyDigits = ref(0);          // 貨幣數值顯示預設為 整數
  const pctDigits = ref(2);               // 百分比顯示預設為 小數 2 位

  // 顯示語系（此處用系統語系，設定為 undefined
  const locale = ref(undefined);


  // Formatter
  const currencyFormatter = computed(() => {
    return new Intl.NumberFormat(locale.value, {
      style: "currency",
      currency: currency.value,                           // 使用合法的 ISO 4217 代碼
      useGrouping: useGrouping.value,                     // 是否啟用千分位分組
      notation: compact.value ? "compact" : "standard",   // 'compact': 縮寫（1.2M）/ 'standard': 一般數字
      minimumFractionDigits: currencyDigits.value,        // 貨幣數值顯示
      maximumFractionDigits: currencyDigits.value         // 貨幣數值顯示
    });
  });

  const pctFormatter = computed(() => {
    return new Intl.NumberFormat(locale.value, {
      style: "percent",
      minimumFractionDigits: pctDigits.value,             // 貨幣數值顯示
      maximumFractionDigits: pctDigits.value              // 貨幣數值顯示
    });
  });


  // 對外提供的格式化工具（給 SFC <template> 直接呼叫）
  const fmtCurrency = (n) => {
    if (!Number.isFinite(n)) return "—";
    return currencyFormatter.value.format(n);
  };

  const fmtPct = (n) => {  // n 用「比率」：0.123 => 12.30%
    if (!Number.isFinite(n)) return "—";
    return pctFormatter.value.format(n);
  };


  // ==================
  // 給 pages/Settings.vue 改設定用
  // ==================
  const setCurrency = (newCurrency) => { currency.value = newCurrency; };
  const setUseGrouping = (val) => { useGrouping.value = !!val; };
  const setCompact = (val) => { compact.value = !!val; };
  const setCurrencyDigits = (digits) => { currencyDigits.value = +digits; };  // 需在 Setting.vue 設定上下界
  const setPctDigits = (digits) => { pctDigits.value = +digits; };            // 需在 Setting.vue 設定上下界
  // ==================


  return { 
    // === 現在狀態 state (for pages/Settings.vue) ===
    currency,           // 現在使用的貨幣單位
    useGrouping,        // 是否使用千分位
    compact,            // 是否用簡寫（1.2K、3.4M）

    // === 格式化工具 ===
    fmtCurrency,        // 格式化貨幣（$1,550、$995）
    fmtPct,             // 格式化百分比（25.30%、-8.55%）

    // === actions (for pages/Settings.vue) ===
    setCurrency,
    setUseGrouping,
    setCompact,
    setCurrencyDigits,
    setPctDigits,
  };
});
