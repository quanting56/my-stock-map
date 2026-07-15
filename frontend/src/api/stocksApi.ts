// Exports:
// - Stocks: fetchStockRange, fetchStockSeries, normalizeStockRows
// - Symbols: fetchAllSymbols, fetchSymbolProfile
// - Market: fetchCompanyRank, fetchMarketTreemapData
// - Fundamentals: fetchFundamentals
// - News: fetchRelevantNews
// 未來應拆檔（拆檔參考在本檔最下方）



// ===============================
// Domain 型別定義
// ===============================

// 後端 / mock 回來、還沒 normalize 前的 row data
export interface StockLikeRow {
  date: string | Date;
  open: number | string | null;
  high: number | string | null;
  low: number | string | null;
  close: number | string | null;
  volume?: number | string | null;
  adjClose?: number | string | null;

  // 允許有多餘欄位（例如 mockData 可能還有別的欄位）
  [key: string]: unknown;
};

// 真正圖表要用的 K 線 bar
export interface StockBar {
  symbol: string;
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number | null;
  volume: number;
};

// 查詢區間參數（你後面會常用到）
export interface StockRangeQuery {
  startYear?: number;
  startMonth?: number;
  endYear?: number;
  endMonth?: number;
  direction?: "auto" | "forward" | "backward";
};

// 股票代號 / 公司資訊
export interface CompanyProfile {
  code: string;       // "2330"
  symbol: string;     // "2330.TW"
  name: string;       // "台積電"
  market: string;     // "上市" / "上櫃" / ...
  industry: string;   // 產業別
};

// 基本面摘要
export interface FundamentalsSnapshot {
  peRatio: number | null;
  pbRatio: number | null;
  yield: number | null;        // 0.047 代表 4.7%
  shareCapital: number | null; // 元
  eps: number | null;          // 估算 TTM EPS
};

// 公司排名
export interface CompanyRank {
  market: string;
  rank: number;
  name: string;
  weight?: number;
  code?: string;
  symbol?: string;
};

// 大盤市值 treemap
export interface MarketTreemapData {
  name: string;                // "TWSE" / "TPEX"
  date: string;                // "YYYY/MM/DD" or "YYYY-MM-DD"
  children: MarketTreemapNode[];
};

export interface MarketTreemapNode {
  id: string;                  // "2330.TW"
  name: string;                // "台積電"
  MarketCapitalizationAsAPercentageOfTheOverallMarket: number; // 0~1
  rank: number;
};

// New / News Item
export interface FetchRelevantNewsOptions {
  days?: number;
  limit?: number;
  lang?: string;
  whitelistOnly?: boolean;
};

export interface RelevantNewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;   // ISO string or null
  summary: string;
};



// ===============================
// 從後端取得資料的函式，允許帶查詢參數（用於最久取全史）
// ===============================

// 簡易 fetch with timeout（前端）
async function fetchJsonWithTimeout(
  url: string,
  { timeout = 8000, ...opts }: { timeout?: number} & RequestInit = {}
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const response = await fetch(url, { ...opts, signal: ctrl.signal, cache: "no-store" });
    return response;
  } finally {
    clearTimeout(t);
  };
};

// 環境無論 dev / prod，前端統一用相對路徑 "/api"
const API_BASE = "";
const api = (path: string): string => `${API_BASE}${path}`;



// ===============================
// 簡單前端快取（memory cache）
//  - key: 代碼，例如 "2330"
// ===============================
interface FundCacheEntry {
  at: number;
  data: FundamentalsSnapshot;
  isFallback?: boolean;
}

interface NewsCacheEntry {
  at: number;                // 暫存時間（毫秒）
  data: RelevantNewsItem[];  // 真正的回傳資料
}

const FUND_CACHE = new Map<string, FundCacheEntry>();  // fundamentals cache
const FUND_TTL_OK = 6 * 60 * 60 * 1000;                // 成功 → 基本面預設 6 小時更新一次
const FUND_TTL_FALLBACK = 60 * 1000;                   // 失敗 → 失敗時基本面只 cache 60 秒

const NEWS_CACHE = new Map<string, NewsCacheEntry>();  // news cache
const NEWS_TTL = 5 * 60 * 1000;                        // 新聞預設 5 分鐘更新一次



export async function fetchStockRange(
  symbol: string,
  params: StockRangeQuery = {}
): Promise<StockLikeRow[]> {
  // 過濾 NaN / null / undefined
  const safeEntries = Object.entries(params).filter(([, v]) => {
    if (v === null || v === undefined) return false;
    if (typeof v === "number" && Number.isNaN(v)) return false;
    return true;
  });

  // 明確轉成 [key, string][]
  const qs = new URLSearchParams(
    safeEntries.map(([k, v]) => [k, String(v)])
  ).toString();

  const url = api(`/api/stocks/${symbol}${qs ? "?" + qs : ""}`);

  const res = await fetchJsonWithTimeout(url, { timeout: 90000 });  // 加 timeout，避免卡住
  if (res.status === 404) return [];  // 代號不存在，直接回空
  if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
  return (await res.json()) as StockLikeRow[];  // 回傳「後端原樣 JSON Array」（日期為 "YYYY/MM/DD" 字串）
};




// ===============================
// 將後端 rows 正規化為可繪圖的陣列（日期→Date、數字→number、排序）
// rows: 後端回傳的 array（含 date: "YYYY/MM/DD"）
// ===============================
export function normalizeStockRows(
  symbol: string = "",
  rows: StockLikeRow[] = []
): StockBar[] {
  // 將潛在不合格的數字轉為轉成純數字
  const toNum = (x: unknown): number | null => {
    if (x == null) return null;
    if (typeof x === "number") return x;
    const n = Number(String(x).replace(/,/g, ""));
    return Number.isFinite(n) ? n : null;
  };

  // 後端已是 "YYYY/MM/DD"，安全轉 ISO 再 new Date，避免不同瀏覽器解析差異
  const toDate = (s: unknown): Date | null => {
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
    .filter((x): x is StockBar => x !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
};




// ===============================
// 直接取得「可繪圖」的序列資料
// ===============================
export async function fetchStockSeries(
  symbol: string,
  params: StockRangeQuery = {}
): Promise<StockBar[]> {
  const raw = await fetchStockRange(symbol, params);
  return normalizeStockRows(symbol, raw);
};




// ===============================
// 取全清單（做搜尋下拉時會用到）
// ===============================
export async function fetchAllSymbols(): Promise<CompanyProfile[]> {
  // 先嘗試打自己的後端，失敗再 fallback 到本地 mock
  try {
    const res = await fetch(api("/api/symbols"));
    if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
    return (await res.json()) as CompanyProfile[];
  } catch(e) {
    // Fallback：讀前端打包內的 JSON 檔（動態載入避免平常佔 bundle）
    const { default: mock } = await import("@/data/mock/mockDataCompanyName.json");
    const MARKET_MAP: Record<string, string> = { twse: "上市", tpex: "上櫃" };
    const arr = Array.isArray(mock?.data) ? mock.data : [];

    // 映射成與 /api/symbols 相同結構（code, symbol, name, market, industry）
    return arr.map((r) => ({
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
export async function fetchSymbolProfile(codeOrSymbol: number | string): Promise<CompanyProfile | null> {
  // 正規化（支援 "2330.TW" / " 2330 "）
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();

  // 跳過臺灣 ETF（幾乎都是 00 開頭），直接不打 API
  if (/^00/.test(code)) return null;

  try {
    const res = await fetchJsonWithTimeout(api(`/api/symbols/${code}`), { timeout: 6000 });  // 6 秒超時；逾時就當作查不到，讓 UI 立刻能提示
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`後端回傳錯誤：${res.status}`);
    return (await res.json()) as CompanyProfile;
  } catch (e) {
    // 網路錯誤/後端掛了 → 直接進 fallback
  };

  // Fallback：用本地 mock 查找並轉成同樣格式
  try {
    const { default: mock } = await import("@/data/mock/mockDataCompanyName.json");
    const MARKET_MAP: Record<string, string> = { twse: "上市", tpex: "上櫃" };
    const arr = Array.isArray(mock?.data) ? mock.data : [];
    const hit = arr.find(r => String(r.stock_id) === code);
    if (!hit) return null;

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
      return { code, symbol: `${code}.TW`, name: code, market: "-", industry: "-" };
    };
    return null;
  };
};



// ===============================
// 獲取公司排名
// ===============================
export async function fetchCompanyRank(codeOrSymbol: number | string): Promise<CompanyRank | null> {
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/,"").trim();

  // 跳過臺灣 ETF（幾乎都是 00 開頭），直接不打 API
  if (/^00/.test(code)) return null;
  
  try {
    const res = await fetch(api(`/api/market-ranks/${code}`));
    if (res.status === 404) return null;   // 後端沒這檔的排名 → 當作沒有
    if (!res.ok) throw new Error(`排名 API 錯誤：${res.status}`);

    return (await res.json()) as CompanyRank;
  } catch {
    return null;  // 網路失敗/伺服器關機 → 不影響頁面
  };
};



// 大盤市值 Treemap 用的資料函式
// 回傳格式：
// { name: "TWSE", date: "2025/09/30", children: [{ id, name, MarketCapitalizationAsAPercentageOfTheOverallMarket }, ...] }
type MarketCode = "TWSE" | "TPEX";

// =========================================
// Market ranks API types (local, from Backend)
// =========================================
interface MarketRanksApiResponse {
  date: string;
  twse: MarketRanksApiRow[];
  tpex: MarketRanksApiRow[];
};

interface MarketRanksApiRow {
  market: string;
  symbol: string;
  code: string;
  name: string;
  weight: number; // 0~100 的百分比
  rank: number;
};
// =========================================

export async function fetchMarketTreemapData(
  { market = "TWSE" }: { market?: MarketCode} = {}
): Promise<MarketTreemapData> {
  const res = await fetch(api("/api/market-ranks"));
  if (!res.ok) throw new Error(`市場市值 API 錯誤：${res.status}`);
  
  const upper = String(market).toUpperCase() as MarketCode;
  const key = upper === "TPEX" ? "tpex" : "twse";  // 預設 TWSE
  
  const json = await res.json() as MarketRanksApiResponse;
  const list = (upper === "TPEX" ? json.tpex : json.twse) ?? [];

  // TAIFEX 給的是「指數成分股比重 %」，Mock 裡是「佔比 (0~1)」，
  // 這裡直接用 weight / 100 當作 MarketCapitalizationAsAPercentageOfTheOverallMarket
  const children: MarketTreemapNode[] = list.filter((r) => r.symbol.length > 0)  // 基本防呆
                                            .map((r) => {
                                              const w = (typeof r.weight === "number" && Number.isFinite(r.weight)) ? r.weight : 0;
                                              return {
                                                id: r.symbol,
                                                name: r.name,  // 「台積電」、「鴻海」⋯
                                                MarketCapitalizationAsAPercentageOfTheOverallMarket: w / 100,  // 變 0~1
                                                rank: r.rank
                                              };
                                            });

  return {
    name: upper,      // "TWSE" 或 "TPEX"
    date: json.date,  // "YYYY/MM/DD"
    children
  };
};



// ===============================
// 取 基本面摘要（走自己後端）
// ===============================
// 基本面空值常數，獲取基本面資料失敗時使用
const EMPTY_FUNDAMENTALS: FundamentalsSnapshot = {
  peRatio: null,
  pbRatio: null,
  yield: null,
  shareCapital: null,
  eps: null
};

export async function fetchFundamentals(codeOrSymbol: number | string): Promise<FundamentalsSnapshot> {
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();

  try {
    // 先看前端 cache（6 小時內就直接用）
    const now = Date.now();
    const cached = FUND_CACHE.get(code);
    if (cached) {
      const ttl = cached.isFallback ? FUND_TTL_FALLBACK : FUND_TTL_OK;
      if ((now - cached.at) < ttl) return cached.data;
    }

    const url = api(`/api/fundamentals/${code}?_t=${Date.now()}`);
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 404) {
      console.warn("[fetchFundamentals] 404 Not Found — 後端路由未掛載或 server 未重啟");

      FUND_CACHE.set(code, { at: now, data: EMPTY_FUNDAMENTALS, isFallback: true });
      return EMPTY_FUNDAMENTALS;
    };

    if (!res.ok) throw new Error(`基本面 API 錯誤：${res.status}`);
    const data = (await res.json()) as FundamentalsSnapshot;

    // 成功時寫入 cache
    FUND_CACHE.set(code, { at: now, data });
    return data;
  } catch (e) {
    console.warn("[fetchFundamentals] fallback with nulls:", e);

    // 寫進 cache，避免短時間內一直重試
    FUND_CACHE.set(code, { at: Date.now(), data: EMPTY_FUNDAMENTALS, isFallback: true });
    return EMPTY_FUNDAMENTALS;
  };
};



// ===============================
// 取 股票相關新聞（走自己後端統一格式）
// 回傳：[{ title, url, source, publishedAt, summary }]
// ===============================
export async function fetchRelevantNews(
  codeOrSymbol: number | string,
  { days = 180, limit = 30, lang = "zh", whitelistOnly = false }: FetchRelevantNewsOptions = {}
): Promise<RelevantNewsItem[]> {
  const code = String(codeOrSymbol).toUpperCase().replace(/\.TW$/, "").trim();
  const url = api(
    `/api/news/${code}?days=${days}&limit=${limit}&lang=${lang}&whitelistOnly=${whitelistOnly ? 1 : 0}`
  );

  // 把查詢條件組成一個 cache key
  const key = JSON.stringify({ code, days, limit, lang, whitelistOnly });
  const now = Date.now();
  const cached = NEWS_CACHE.get(key);
  if (cached && (now - cached.at) < NEWS_TTL) return cached.data;

  const res = await fetchJsonWithTimeout(url, { timeout: 12000 });
  if (!res.ok) throw new Error(`新聞 API 錯誤：${res.status}`);
  const data = (await res.json()) as RelevantNewsItem[];

  // 寫入 cache
  NEWS_CACHE.set(key, { at: now, data });
  return data;
};


/* ChatGPT 建議方案：按領域拆檔

把 stocksApi.ts 拆成：

src/api/
  http.ts            // fetchJsonWithTimeout, api(), 共用錯誤處理
  cache.ts           // FUND_CACHE/NEWS_CACHE + TTL + entry type
  stocks.ts          // fetchStockRange, fetchStockSeries, normalizeStockRows
  symbols.ts         // fetchAllSymbols, fetchSymbolProfile
  fundamentals.ts    // fetchFundamentals
  marketRanks.ts     // fetchCompanyRank, fetchMarketTreemapData
  news.ts            // fetchRelevantNews
  types.ts           // 你的 Domain interfaces (或每個檔案各自 export)
  index.ts           // 統一 re-export


然後你在外部只用：

import { fetchStockSeries, fetchFundamentals } from "@/api";


src/api/index.ts：

export * from "./stocks";
export * from "./symbols";
export * from "./fundamentals";
export * from "./marketRanks";
export * from "./news";
export * from "./types";


👉 這樣搜尋/跳轉超快，而且各檔案會變短、可讀性最好。
*/
