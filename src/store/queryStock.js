import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useQueryStockStore = defineStore("queryStock", () => {
  // 預設顯示標的
  const symbol = ref("2330");

  // 統一顯示字串格式，例如 2330 -> 2330.TW
  const displaySymbol = computed(() => {
    const v = (symbol.value || "").toUpperCase();
    // 顯示 4 碼股票則補'.TW'，其他保留原樣
    return /^\d{4}$/.test(v) ? `${v}.TW` : v;
  });

  // 正規化使用者輸入，支援 2330 / 2330.tw / 台積電，再依後端需求微調
  function setSymbol(input) {
    let q = (input || "").trim();
    if (!q) return;

    // 大寫與去空白
    q = q.toUpperCase().replace(/\s+/g, "");

    // 若是 4碼 或 4碼+'.TW'，就取 純4碼 當核心代號
    const m = q.match(/^(\d{4})(?:\.?TW)?$/i);
    if (m) {
      symbol.value = m[1]; // 只存 4 碼
      return;
    };

    // 其他情況（指數、海外市場、字母代號…），直接存原字串
    symbol.value = q;
  };

  return { symbol, displaySymbol, setSymbol };
});
