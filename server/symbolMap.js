import fetch from "node-fetch";
import iconv from "iconv-lite";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

// 確保 data 目錄存在
const DATA_DIR = path.join("data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const CACHE_PATH = path.join(DATA_DIR, "symbols.json");

// FinMind 備援資料源（官方公開資料集，含代碼/名稱/產業/上市別）
const FINMIND_URL = "https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInfo";

const SOURCES = [
  { label: "TWSE", url: "https://isin.twse.com.tw/isin/C_public.jsp?strMode=2" }, // 上市
  { label: "OTC",  url: "https://isin.twse.com.tw/isin/C_public.jsp?strMode=4" }, // 上櫃
];

async function fetchHtmlBig5(url, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      // 模擬瀏覽器的標頭，降低被擋的機率
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
        "Referer": "https://isin.twse.com.tw/isin/class"
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    // 以 Big5 轉 UTF-8（ISIN 頁面為 MS950/Big5）
    return iconv.decode(buf, "big5");
  } finally {
    clearTimeout(t);
  };
};

/** 解析 ISIN 表格成 rows */
function parseIsinTable(html, marketLabel) {
  const $ = cheerio.load(html);
  const rows = [];

  // ISIN 頁面主表通常 class="h4"
  $("table.h4 tr").each((_, tr) => {
    const tds = $(tr).find("td");
    // 欄位常見結構（8 欄）：[種類, 代號及名稱, ISIN, 上市日, 市場別, 產業別, CFICode, 備註]
    if (tds.length < 6) return;

    const codeNameText = tds.eq(1).text().trim().replace(/\u3000/g, " "); // 代號及名稱
    const market = tds.eq(4).text().trim() || marketLabel;
    const industry = tds.eq(5).text().trim();

    // 取「純數字股票/ETF 代碼」開頭的列，例如 "2330 台積電"、"0050 元大台灣50"、"00675L 元大台灣50正2"
    const m = codeNameText.match(/^(\d{4,6}[A-Z]{0,2})\s+(.+)$/); // CHANGED
    if (!m) return;

    const code = m[1];
    const name = m[2].trim();

    rows.push({
      code,                 // "2330"
      symbol: `${code}.TW`, // 統一前端顯示
      name,                 // "台積電"
      market,               // "上市"/"上櫃"...
      industry,             // 產業別
    });
  });

  return rows;
}

// FinMind 備援抓取（官方開源資料，穩定又免轉碼）
async function loadFromFinMind() {
  const res = await fetch(FINMIND_URL, {
    headers: { "User-Agent": "Mozilla/5.0" }
  });
  if (!res.ok) throw new Error(`finmind HTTP ${res.status}`);
  const json = await res.json();
  const arr = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
  // FinMind 欄位：stock_id, stock_name, industry_category, type(上市/上櫃)
  return arr
    .filter(r => r?.stock_id && r?.stock_name)
    .map(r => ({
      code: String(r.stock_id),
      symbol: `${r.stock_id}.TW`,
      name: String(r.stock_name),
      market: r.type ? String(r.type) : "",
      industry: r.industry_category ? String(r.industry_category) : ""
    }));
};

async function loadAllSymbols({ force = false } = {}) {
  // 先讀快取（避免每次冷啟都打官方）
  if (!force && fs.existsSync(CACHE_PATH)) {
    try {
      const json = JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8"));
      return json;
    } catch {}
  }

  let all = [];
  for (const s of SOURCES) {
    try {
      const html = await fetchHtmlBig5(s.url);
      const rows = parseIsinTable(html, s.label);
      const cleaned = rows.filter(r => r && r.code && r.name);  // 過濾空值
      all = all.concat(cleaned);
    } catch (e) {
      console.warn(`[symbolMap] 來源 ${s.label} 抓取失敗：`, e.message);
    }
  }

  // 若 ISIN 抓不到「足量」資料（或 0 筆），就自動改用 FinMind 備援
  if (all.length < 500) {  // 閾值 500 你也可調成 1000
    console.warn(`[symbolMap] ISIN 回傳數量過少 (${all.length})，改用 FinMind 備援`);
    try {
      all = await loadFromFinMind(); // NEW
    } catch (e) {
      console.error(`[symbolMap] FinMind 也失敗：`, e.message);
      // 最後兜底：如果已有舊快取，就讀舊的；否則丟錯
      if (fs.existsSync(CACHE_PATH)) {
        try { return JSON.parse(fs.readFileSync(CACHE_PATH, "utf-8")); }
        catch {}
      };
      throw e;
    }
  }

  // 以代碼去重（上市/上櫃重複時保留第一筆）
  const uniq = [];
  const seen = new Set();
  for (const r of all) {
    if (seen.has(r.code)) continue;
    seen.add(r.code);
    uniq.push(r);
  }

  // 寫快取
  fs.writeFileSync(CACHE_PATH, JSON.stringify(uniq, null, 2), "utf-8");
  return uniq;
}

export function installSymbolRoutes(app) {
  let cache = null;
  let lastLoadAt = 0;
  const TTL = 24 * 60 * 60 * 1000; // 一天自動刷新一次（可調）

  // 啟動時先載入一次（失敗也不影響啟動）
  loadAllSymbols()
    .then((d) => { cache = d; lastLoadAt = Date.now(); })
    .catch(() => {});

  // 取用前若 cache 不存在或過期，主動補一次
  async function ensureCache() {
    const needReload = !cache || (Date.now() - lastLoadAt > TTL);
    if (needReload) {
      cache = await loadAllSymbols({ force: true });
      lastLoadAt = Date.now();
    }
    return cache;
  }

  // 取得全清單
  app.get("/api/symbols", async (req, res) => {
    try {
      await ensureCache();
      // ✨ 支援手動強制刷新：/api/symbols?force=1
      if (String(req.query.force || "") === "1") {
        cache = await loadAllSymbols({ force: true });
        lastLoadAt = Date.now();
      }
      res.json(cache);
    } catch (e) {
      res.status(500).json({ error: "symbol_load_failed", message: e.message });
    }
  });

  // 模糊搜尋：名稱或代碼
  app.get("/api/symbols/search", async (req, res) => {
    const q = String(req.query.q || "").trim();
    try {
      await ensureCache();
      if (!q) return res.json([]);
      const qq = q.toLowerCase();
      const result = cache.filter(
        (r) => r.code.startsWith(q) || r.name.toLowerCase().includes(qq)
      ).slice(0, 100);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: "symbol_search_failed", message: e.message });
    }
  });

  // 查單一代碼（四碼/五碼皆可）
  app.get("/api/symbols/:code", async (req, res) => {
    // 正規化傳入參數：去掉 .TW、清空白
    const code = String(req.params.code || "").toUpperCase().replace(/\.TW$/, "").trim();
    try {
      await ensureCache();
      let hit = cache.find((r) => r.code === code);
      // 如果沒命中，兜底：強制重抓一次再找（第一次冷啟或來源臨時失敗時有用）
      if (!hit) {
        cache = await loadAllSymbols({ force: true });
        lastLoadAt = Date.now();
        hit = cache.find((r) => r.code === code);
      }
      if (!hit) return res.status(404).json({ error: "not_found" });
      res.json(hit);
    } catch (e) {
      res.status(500).json({ error: "symbol_lookup_failed", message: e.message });
    };
  });

  // 簡易偵錯端點（可選）：看目前 cache 筆數
  app.get("/api/symbols/_debug", async (_req, res) => {
    res.json({ size: cache?.length || 0, sample: (cache || []).slice(0, 5) });
  });
};
