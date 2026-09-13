import { ref, computed } from "vue";
import { defineStore } from "pinia";

export const useQueryStockStore = defineStore("queryStock", () => {
  // 預設顯示標的
  const symbol = ref<string>("2330");

  // 統一顯示字串格式，例如 2330 → 2330.TW
  const displaySymbol = computed<string>(() => {
    const v = (symbol.value || "").toUpperCase();

    // 4～6 碼數字 + 可選 0～2 個字母尾碼 → 顯示加上 .TW
    return /^\d{4,6}[A-Z]{0,2}$/.test(v) ? `${v}.TW` : v;
  });

  /** 正規化使用者輸入 → 台股代碼移除 .TW，其他字串則保留供後續處理。 */
  function setSymbol(input: unknown): void {
    if (typeof input !== "string" && typeof input !== "number") {
      return;
    }

    let q = String(input).trim();

    if (!q) {
      return;
    }

    // 大寫與去空白
    q = q.toUpperCase().replace(/\s+/g, "");

    // 接受 4~6 碼 + 0~2 字母尾碼；可帶 .TW
    const m = q.match(/^(\d{4,6}[A-Z]{0,2})(?:\.?TW)?$/i);
    const code = m?.[1];

    if (code) {
      symbol.value = code; // 只存 4~6 碼
      return;
    }

    // 其他情況（指數、海外市場、字母代號…），直接存原字串
    symbol.value = q;
  }

  return {
    symbol,
    displaySymbol,
    setSymbol,
  };
});
