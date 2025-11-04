// 從後端取得資料的函式，允許帶查詢參數（用於最久取全史）
export async function fetchStockRange(symbol, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const url = `http://localhost:3000/api/stocks/${symbol}${qs ? "?" + qs : ""}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
  return res.json();  // 回傳「後端原樣 JSON Array」（日期為 "YYYY/MM/DD" 字串）
};





/**
 * 將後端 rows 正規化為可繪圖的陣列（日期→Date、數字→number、排序）
 * @param {Array<any>} rows 後端回傳的 array（含 date: "YYYY/MM/DD"）
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

  // 後端已是 "YYYY/MM/DD"，安全轉 ISO 再 new Date，避免不同瀏覽器解析差異
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




// 取全清單（做搜尋下拉時會用到）
export async function fetchAllSymbols() {
  // 先嘗試打自己的後端，失敗再 fallback 到本地 mock
  try {
    const res = await fetch("http://localhost:3000/api/symbols");
    if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
    return res.json();
  } catch(e) {
    // Fallback：讀前端打包內的 JSON 檔（動態載入避免平常佔 bundle）
    const { default: mock } = await import("@/data/mock/mockDataCompanyName.json"); // NEW
    const MARKET_MAP = { twse: "上市", tpex: "上櫃" }; // NEW
    const arr = Array.isArray(mock?.data) ? mock.data : [];
    // 映射成與 /api/symbols 相同結構（code, symbol, name, market, industry）
    return arr.map(r => ({ // NEW
      code: String(r.stock_id),
      symbol: `${r.stock_id}.TW`,
      name: String(r.stock_name),
      market: MARKET_MAP[r.type?.toLowerCase?.()] ?? (r.type ?? ""),
      industry: r.industry_category ?? ""
    }));
  };
};

// 用四/五碼代號查公司（回 { code, symbol, name, market, industry }）
export async function fetchSymbolProfile(codeOrSymbol) {
  // 正規化（支援 "2330.TW" / " 2330 "）
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();
  try {
    const res = await fetch(`http://localhost:3000/api/symbols/${code}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
    return res.json();
  } catch (e) {
    // 網路錯誤/後端掛了 → 直接進 fallback
  };

  // Fallback：用本地 mock 查找並轉成同樣格式
  try {
    const { default: mock } = await import("@/data/mock/mockDataCompanyName.json"); // NEW
    const MARKET_MAP = { twse: "上市", tpex: "上櫃" }; // NEW
    const arr = Array.isArray(mock?.data) ? mock.data : [];
    const hit = arr.find(r => String(r.stock_id) === code); // NEW
    if (!hit) return null; // NEW
    return { // NEW：回傳結構與後端一致
      code: String(hit.stock_id),
      symbol: `${hit.stock_id}.TW`,
      name: String(hit.stock_name),
      market: MARKET_MAP[hit.type?.toLowerCase?.()] ?? (hit.type ?? ""),
      industry: hit.industry_category ?? ""
    };
  } catch {
    return null; // NEW：mock 檔讀不到就回 null，SFC 會顯示 "—"
  };
};
