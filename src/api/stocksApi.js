// ===============================
// 從後端取得資料的函式，允許帶查詢參數（用於最久取全史）
// ===============================
// 簡易 fetch with timeout（前端）
async function fetchJsonWithTimeout(url, { timeout = 8000, ...opts } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
    return res;
  } finally {
    clearTimeout(t);
  };
};

// 環境無論 dev / prod，前端統一用相對路徑 "/api"
const API_BASE = "";
const api = (path) => `${API_BASE}${path}`;



// ===============================
// 簡單前端快取（memory cache）
//  - key: 代碼，例如 "2330"
//  - at:   暫存時間（毫秒）
//  - data: 真正的回傳資料
// ===============================
const FUND_CACHE = new Map();           // fundamentals cache
const FUND_TTL = 6 * 60 * 60 * 1000;   // 基本面預設 6 小時更新一次

const NEWS_CACHE = new Map();           // news cache
const NEWS_TTL = 5 * 60 * 1000;        // 新聞預設 5 分鐘更新一次




export async function fetchStockRange(symbol, params = {}) {
  const safe = Object.fromEntries(
    Object.entries(params).filter(([,v]) => v !== null && v !== undefined && !(typeof v === "number" && Number.isNaN(v)))
  );  // 過濾 NaN/undefined
  const qs = new URLSearchParams(safe).toString();
  const url = api(`/api/stocks/${symbol}${qs ? "?" + qs : ""}`);

  const res = await fetchJsonWithTimeout(url, { timeout: 90000 });  // 加 timeout，避免卡住
  if (res.status === 404) return [];  // 代號不存在，直接回空
  if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
  return res.json();  // 回傳「後端原樣 JSON Array」（日期為 "YYYY/MM/DD" 字串）
};




// ===============================
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
// ===============================
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




// ===============================
/**
 * 直接取得「可繪圖」的序列資料
 * @param {string} symbol
 * @param {Object} params {startYear,startMonth,endYear,endMonth}
 * @returns {Promise<StockBar[]>}
 */
// ===============================
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




// ===============================
// 取全清單（做搜尋下拉時會用到）
// ===============================
export async function fetchAllSymbols() {
  // 先嘗試打自己的後端，失敗再 fallback 到本地 mock
  try {
    const res = await fetch(api("/api/symbols"));
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



// ===============================
// 用四/五碼代號查公司（回 { code, symbol, name, market, industry }）
// ===============================
export async function fetchSymbolProfile(codeOrSymbol) {
  // 正規化（支援 "2330.TW" / " 2330 "）
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();
  try {
    const res = await fetchJsonWithTimeout(api(`/api/symbols/${code}`), { timeout: 6000 });  // 6 秒超時；逾時就當作查不到，讓 UI 立刻能提示
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
    return {  // 回傳結構與後端一致
      code: String(hit.stock_id),
      symbol: `${hit.stock_id}.TW`,
      name: String(hit.stock_name),
      market: MARKET_MAP[hit.type?.toLowerCase?.()] ?? (hit.type ?? ""),
      industry: hit.industry_category ?? ""
    };
  } catch {
    // 最後兜底，至少回基本結構，讓圖表可用，標籤顯示代碼
    if (/^\d{4,6}[A-Z]{0,2}$/.test(code)) {
      return { code, symbol: `${code}.TW`, name: code, market: "", industry: "" }; // CHANGED
    };
    return null;
  };
};



// ===============================
// 獲取公司排名
// ===============================
export async function fetchCompanyRank(codeOrSymbol){
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/,"").trim();
  
  // 簡易規則 — 台灣 ETF 幾乎都是 00 開頭（0050、006208...），直接不打 API
  if (/^00/.test(code)) return null;
  try {
    const res = await fetch(api(`/api/market-ranks/${code}`));
    if (res.status === 404) return null;   // 後端沒這檔的排名 → 當作沒有
    if (!res.ok) throw new Error(`排名 API 錯誤：${res.status}`);
    return res.json();  // {market, rank, name, weight?, code?, symbol?}
  } catch {
    return null;  // 網路失敗/伺服器關機 → 不影響頁面
  };
};

// 大盤市值 Treemap 用的資料函式
// 回傳格式：
// { name: "TWSE", date: "2025/09/30", children: [{ id, name, MarketCapitalizationAsAPercentageOfTheOverallMarket }, ...] }
export async function fetchMarketTreemapData({ market = "TWSE" } = {}) {
  const res = await fetch(api("/api/market-ranks"));
  if (!res.ok) throw new Error(`市場市值 API 錯誤：${res.status}`);
  const json = await res.json();

  const upper = String(market).toUpperCase();
  const key = upper === "TPEX" ? "tpex" : "twse";  // 預設 TWSE
  const list = Array.isArray(json[key]) ? json[key] : [];

  // TAIFEX 給的是「指數成分股比重 %」，Mock 裡是「佔比 (0~1)」，
  // 這裡直接用 weight / 100 當作 MarketCapitalizationAsAPercentageOfTheOverallMarket
  const children = list.filter((r) => r && r.name)  // 基本防呆
                       .map((r) => {
                         const w = (typeof r.weight === "number" && Number.isFinite(r.weight)) ? r.weight : 0;
                         return {
                           id: r.symbol || (r.code ? `${r.code}.TW` : r.name),
                           name: r.name,  // 「台積電」、「鴻海」⋯
                           MarketCapitalizationAsAPercentageOfTheOverallMarket: w / 100,  // 變 0~1
                         };
                       });

  return {
    name: upper,  // "TWSE" 或 "TPEX"
    date: json.date || "",  // "YYYY-MM-DD"
    children
  };
};



// ===============================
// 取 基本面摘要（走自己後端）
// 回傳同 server：{ peRatio, pbRatio, yield, shareCapital, eps }
// ===============================
export async function fetchFundamentals(codeOrSymbol) {
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();
  try {
    // 先看前端 cache（6 小時內就直接用）
    const now = Date.now();
    const cached = FUND_CACHE.get(code);
    if (cached && (now - cached.at) < FUND_TTL) {
      return cached.data;
    }

    const url = api(`/api/fundamentals/${code}?_t=${Date.now()}`);
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 404) {
      // 明確標示沒有該路由/未掛載，方便從前端 Console 看到線索
      console.warn("[fetchFundamentals] 404 Not Found — 後端路由未掛載或 server 未重啟");
      return { peRatio: null, pbRatio: null, yield: null, shareCapital: null, eps: null };
    };

    if (!res.ok) throw new Error(`基本面 API 錯誤：${res.status}`);
    const data = await res.json();

    // 成功時寫入 cache
    FUND_CACHE.set(code, { at: now, data });
    return data;
  } catch (e) {
    console.warn("[fetchFundamentals] fallback with nulls:", e?.message || e);

    // 兜底：讓畫面維持可用
    const data = { peRatio: null, pbRatio: null, yield: null, shareCapital: null, eps: null };

    // 寫進 cache，避免短時間內一直重試
    FUND_CACHE.set(code, { at: Date.now(), data });
    return data;
  };
};



// ===============================
// 取 股票相關新聞（走自己後端統一格式）
// 回傳：[{ title, url, source, publishedAt, summary }]
// ===============================
export async function fetchRelevantNews(
  codeOrSymbol,
  { days = 180, limit = 30, lang = "zh", whitelistOnly = false } = {}
) {
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();
  const url = api(
    `/api/news/${code}?days=${days}&limit=${limit}&lang=${lang}&whitelistOnly=${whitelistOnly ? 1 : 0}`
  );

  // 把查詢條件組成一個 cache key
  const key = JSON.stringify({ code, days, limit, lang, whitelistOnly });
  const now = Date.now();
  const cached = NEWS_CACHE.get(key);
  if (cached && (now - cached.at) < NEWS_TTL) {
    return cached.data;
  }

  const res = await fetchJsonWithTimeout(url, { timeout: 12000 });
  if (!res.ok) throw new Error(`新聞 API 錯誤：${res.status}`);
  const data = await res.json();

  // 寫入 cache
  NEWS_CACHE.set(key, { at: now, data });
  return data;
};
