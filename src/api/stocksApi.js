// 從後端取得資料的函式，允許帶查詢參數（用於最久取全史）
export async function fetchStockRange(symbol, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `http://localhost:3000/api/stocks/${symbol}${qs ? "?" + qs : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
  return res.json();  // 回傳「後端原樣 JSON Array」（日期為 'YYYY/MM/DD' 字串）
};





/**
 * 將後端 rows 正規化為可繪圖的陣列（日期→Date、數字→number、排序）
 * @param {Array<any>} rows 後端回傳的 array（含 date: 'YYYY/MM/DD'）
 * @param {string} symbol
 * @returns {Array<{
 *  symbol: string,
 *  date: Date,
 *  open: number,
 *  high: number,
 *  low: number,
 *  close: number,
 *  adjClose: number|null,
 *  volume: number
 * }>}
 */
export function normalizeStockRows(symbol = "", rows = []) {
  const toNum = (x) => {
    if (x == null) return null;
    if (typeof x === "number") return x;
    const n = Number(String(x).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  // 後端已是 'YYYY/MM/DD'，安全轉 ISO 再 new Date，避免不同瀏覽器解析差異
  const toDate = (s) => {
    if (s instanceof Date) return s;
    if (typeof s !== "string") return null;
    const iso = s.replace(/\//g, "-");
    const d = new Date(iso);
    return Number.isNaN(+d) ? null : d;
  };

  return rows
    .map((r) => {
      const d = toDate(r.date);
      const open  = toNum(r.open);
      const high  = toNum(r.high);
      const low   = toNum(r.low);
      const close = toNum(r.close);
      const volume = toNum(r.volume) ?? 0;
      const adjClose = r.adjClose != null ? toNum(r.adjClose) : (close ?? null);
      return (d && open != null && high != null && low != null && close != null)
        ? { symbol, date: d, open, high, low, close, adjClose, volume }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date - b.date);
};





/**
 * 直接取得「可繪圖」的序列資料
 * @param {string} symbol
 * @param {Object} params {startYear,startMonth,endYear,endMonth}
 * @returns {Promise<StockBar[]>}
 */
export async function fetchStockSeries(symbol, params = {}) {
  const raw = await fetchStockRange(symbol, params);
  return normalizeStockRows(symbol, raw);
};





// Vue SFC 使用方法
// <script setup>
// import { fetchStockSeries } from "@/api/stocksApi.js";

// const rows = await fetchStockSeries("2330", {
//   startYear: 2020, startMonth: 1,
//   endYear: 2025, endMonth: 10
// });
// // rows: StockBar[]（date 已是 Date、已排序）
// </script>


// mock 情境
// <script setup>
// import { normalizeStockRows } from "@/api/stocksApi.js";
// import { mockData2330 } from "@/data/mock/mockData2330.js";

// const rows = normalizeStockRows("2330", mockData2330);
// </script>
