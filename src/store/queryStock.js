import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useQueryStockStore = defineStore("queryStock", () => {
  // 預設顯示標的
  const symbol = ref("2330");

  // 統一顯示字串格式，例如 2330 -> 2330.TW
  const displaySymbol = computed(() => {
    const v = (symbol.value || "").toUpperCase();
    // 4~5 碼 + 可選 1 字母尾碼 → 顯示加 .TW
    return /^\d{4,6}[A-Z]{0,2}$/.test(v) ? `${v}.TW` : v;
  });

  // 正規化使用者輸入，支援 2330 / 2330.tw / 台積電，再依後端需求微調
  function setSymbol(input) {
    let q = (input || "").trim();
    if (!q) return;

    // 大寫與去空白
    q = q.toUpperCase().replace(/\s+/g, "");

    // 接受 4~6 碼 + 0~2 字母尾碼；可帶 .TW
    const m = q.match(/^(\d{4,6}[A-Z]{0,2})(?:\.?TW)?$/i);
    if (m) {
      symbol.value = m[1]; // 只存 4~6 碼
      return;
    };

    // 其他情況（指數、海外市場、字母代號…），直接存原字串
    symbol.value = q;
  };

  return { symbol, displaySymbol, setSymbol };
});
