// ===============================
//  Node.js + Express + SQLite 快取伺服器
//  整合前端 Dashboard/PerformanceChart.vue 的 TWSE 股價 API
// ===============================

import express from "express";
import fetch from "node-fetch";
import Database from "better-sqlite3";
import fs from "fs";
import cors from "cors";


// 為了拿到 __dirname
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 得到 台股股票代號 與 公司名稱（含ETF） 的對應
import { installSymbolRoutes, getSymbol } from "./symbolMap.js";

// 得到 上市上櫃 公司市值排名
import { installRankingRoutes } from "./rankings.js";

// 得到 基本面 資訊
import { installFundamentalRoutes } from "./fundamentalDetails.js";


// -------------------------------
//  初始化基本設定
// -------------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Railway Volume 可設 DATA_DIR=/data
// 若 DATA_DIR 是相對路徑，固定以 backend/ 為基準
const DATA_DIR =
  process.env.DATA_DIR
    ? path.resolve(__dirname, process.env.DATA_DIR)
    : path.join(__dirname, "data");

fs.mkdirSync(DATA_DIR, { recursive: true });

const dbPath = path.join(DATA_DIR, "stocks.db");


// Health check
app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true, ts: Date.now() });
});

// 避免弱驗證快取造成舊 JSON 被重用
app.set("etag", false);

// 啟用 CORS
const rawCors = String(process.env.CORS_ORIGIN || "").trim();
if (rawCors) {
  const origins = rawCors.split(",").map(s => s.trim()).filter(Boolean);
  app.use(cors({ origin: origins }));
} else {
  app.use(cors());  // CORS 放寬（dev / prod 都 OK）
}

// 建立 / 連線 SQLite 資料庫
const db = new Database(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_prices (
    symbol TEXT,
    date TEXT,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    PRIMARY KEY (symbol, date)
  )
`);

// -------------------------------
//  工具函式：補 0（例如 1 → 01）
// -------------------------------
function pad(num) {
  return num.toString().padStart(2, "0");
};

// ===============================
// Symbol 正規化（canonical key）
// - DB/回傳：2330.TW
// - 打 TWSE：2330
// ===============================
function normalizeSymbolInput(input = "") {
  const raw = String(input || "").toUpperCase().trim();
  if (!raw) return { symbol: "", code: "", exch: "" };
  if (raw.includes(".")) {
    const [code, exch] = raw.split(".", 2);
    return { symbol: `${code}.${exch}`, code, exch };
  }
  // 沒帶尾碼：目前視為台股（向後兼容）
  return { symbol: `${raw}.TW`, code: raw, exch: "TW" };
}

// -------------------------------
//  工具函式：呼叫證交所 API 抓取單月資料
// -------------------------------
async function fetchMonth(code, year, month) {
  const date = `${year}${pad(month)}01`;
  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${code}`;
  
  // 加 UA + Origin/Referer + 10 秒超時，降低 30x 風控與長時間卡住
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "application/json,text/plain,*/*",
        "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        "Origin": "https://www.twse.com.tw",
        "Referer": "https://www.twse.com.tw/zh/trading/exchange/STOCK_DAY.html" // NEW
      },
      redirect: "follow",
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  } catch (e) {
    if (e.name === "AbortError") throw new Error("timeout");  // 統一訊息
    throw e;
  } finally {
    clearTimeout(t);
  };
};

// -------------------------------
//  工具函式：民國年 → 西元年（支援 2位或3位數；也容忍已是西元的字串）
// -------------------------------
function rocToAd(dateStr) {
  // 可能是 "114/01/05"、"89/01/05"（民國），或 "2025/01/05"（已是西元）
  const m = /^(\d{2,3})\/(\d{2})\/(\d{2})$/.exec(dateStr);
  if (!m) return dateStr; // 不符合預期格式就原樣回傳（TWSE 偶爾會有空白/奇怪字元）
  let [, y, mm, dd] = m;
  let yearNum = parseInt(y, 10);
  // 小於 1911 視為民國年；≥1911 視為本就西元
  if (yearNum < 1911) yearNum += 1911;
  return `${yearNum}/${mm}/${dd}`; // 統一成 YYYY/MM/DD
};

// -------------------------------
// 變更：工具函式：月份迭代器（支援跨年）
// -------------------------------
function* iterateMonths(y1, m1, y2, m2) {
  let y = y1, m = m1;
  while (y < y2 || (y === y2 && m <= m2)) {
    yield { y, m };
    m++;
    if (m > 12) { m = 1; y++; }
  };
};

// -------------------------------
// 工具函式：年月比較 & 倒序月份迭代器（支援從新到舊）
// -------------------------------
function compareYm(y1, m1, y2, m2) {
  if (y1 !== y2) return y1 - y2;
  return m1 - m2;
};
function* iterateMonthsDesc(y1, m1, y2, m2) {
  let y = y1, m = m1;
  while (y > y2 || (y === y2 && m >= m2)) {
    yield { y, m };
    m--;
    if (m < 1) { m = 12; y--; }
  };
};

// -------------------------------
// 工具函式：組 YYYY/MM 方便 LIKE 查詢
// -------------------------------
function ymStr(y, m) {
  return `${y}/${String(m).padStart(2, "0")}`;
};

// 取「今天的年/月」做為往後補齊的上限
function todayYm() {
  const now = new Date();
  return { y: now.getFullYear(), m: now.getMonth() + 1 };
};

// 格式化 Date -> 'YYYY/MM/DD'
function fmtYmd(d) {
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())}`;
};

// 是否已有「今天或昨天」的資料
function hasTodayOrYesterday(symbol) {
  const now = new Date();
  const todayStr = fmtYmd(now);
  const yst = new Date(now);
  yst.setDate(now.getDate() - 1);
  const ystStr = fmtYmd(yst);
  const row = db.prepare(
    `SELECT COUNT(1) AS c FROM stock_prices WHERE symbol=? AND date IN (?,?)`
  ).get(symbol, todayStr, ystStr);
  return (row?.c || 0) > 0;
};

// 從 'YYYY/MM/DD' 擷取 {y, m}
function ymFromDateStr(dateStr) {
  // 預期 'YYYY/MM/DD'
  const y = parseInt(dateStr.slice(0, 4), 10);
  const m = parseInt(dateStr.slice(5, 7), 10);
  return { y, m };
};

// 迭代「不含起點」的往後月份（起點的下一個月開始）
function* iterateMonthsExclusiveNext(y1, m1, y2, m2) {
  // 從 (y1, m1) 的下一個月開始
  let y = y1, m = m1 + 1;
  if (m > 12) { m = 1; y += 1; }
  while (y < y2 || (y === y2 && m <= m2)) {
    yield { y, m };
    m++;
    if (m > 12) { m = 1; y++; }
  }
};

// -------------------------------
//  API：查詢某檔股票（例：/api/stocks/2330?startYear=2025&startMonth=1&endMonth=10）
// -------------------------------
app.get("/api/stocks/:symbol", async (req, res) => {
  const { symbol, code, exch } = normalizeSymbolInput(req.params.symbol);
  const { y: todayY, m: todayM } = todayYm();  // 先拿今天年月
  const toInt = (v, def) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; };
  const startYear  = toInt(req.query.startYear,  todayY - 20);
  const startMonth = toInt(req.query.startMonth, 1);
  const endYear    = toInt(req.query.endYear,    todayY);
  const endMonth   = toInt(req.query.endMonth,   todayM);
  const directionParam = (req.query.direction || "auto").toString();  // "forward" | "backward" | "auto"

  try {
    if (exch !== "TW") {
      return res.status(400).json({ error: "exchange_not_supported_yet", message: `Unsupported exchange: ${exch}` });
    }
    const profile = await getSymbol(code, { force: false });
    if (!profile) {
      return res.status(404).json({ error: "symbol_not_found", message: `Unknown symbol: ${symbol}` });
    }

    // 逐月檢查快取；缺的月份才抓，抓完 upsert
    const insert = db.prepare(`
      INSERT OR REPLACE INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES (@symbol, @date, @open, @high, @low, @close, @volume)
    `);
    const tx = db.transaction((records) => records.forEach((r) => insert.run(r)));

    let newlyFetched = 0;
    // 連續空月/錯誤月偵測（避免很久以前一直打）
    let emptyStreak = 0;
    const EMPTY_BREAK = 7; // 例如連續 7 個月空資料，視為已早於上市

    // 預先判斷「今天或昨天是否已有資料」
    const hasRecent = hasTodayOrYesterday(symbol);

    // 決定抓取方向（向前或向後月份）
    const useBackward =
      directionParam === "backward" ||
      (directionParam === "auto" && compareYm(startYear, startMonth, endYear, endMonth) > 0);
    console.log(
      `➡️ 抓取方向：${useBackward ? "backward" : "forward"} | 範圍：${startYear}/${String(startMonth).padStart(2,"0")} ~ ${endYear}/${String(endMonth).padStart(2,"0")}`
    );
    const iter = useBackward
      ? iterateMonthsDesc(endYear, endMonth, startYear, startMonth)
      : iterateMonths(startYear, startMonth, endYear, endMonth);

    for (const { y, m } of iter) {
      const like = ymStr(y, m) + "/%";
      const { c } = db.prepare(
        `SELECT COUNT(1) as c FROM stock_prices WHERE symbol = ? AND date LIKE ?`
      ).get(symbol, like);

      const isCurrentMonth = (y === todayY && m === todayM);

      // 同樣套用「今/昨已有資料就略過」
      if (c > 0 && !isCurrentMonth) continue;
      if (c > 0 && isCurrentMonth && hasRecent) continue;
      if (isCurrentMonth && c > 0 && !hasRecent) {
        console.log(`♻️(forward-fill:init) 重新整理當月 ${symbol} ${y}/${pad(m)}（今/昨無資料）`);
      };

      console.log(`🌐 抓取 ${symbol} ${y}/${String(m).padStart(2, "0")}`);
      let rows = [];
      try {
        rows = await fetchMonth(code, y, m);
      } catch (err) {
        // 單月錯誤不讓整體中斷，紀錄並當作空月處理
        console.warn(`⚠️ 抓取失敗 ${symbol} ${y}/${String(m).padStart(2,"0")}：${err.message}`);
        rows = [];

        // 連續重導/逾時終止
        if (!globalThis.__twseFailStreak) globalThis.__twseFailStreak = 0;
        if (/maximum redirect/i.test(err.message) || /timeout/i.test(err.message)) {
          globalThis.__twseFailStreak++;
        } else {
          globalThis.__twseFailStreak = 0;
        };
        if (globalThis.__twseFailStreak >= 3) {
          console.warn(`🧯 偵測到連續 ${globalThis.__twseFailStreak} 次重導/逾時，暫停本次批次抓取以避免被風控。`);
          break;
        };
      };

      const batch = [];
      for (const r of rows) {
        const [date, shares, , open, high, low, close] = r;
        if (!open || !close) continue;
        const normalizedDate = rocToAd((date || "").trim());
        batch.push({
          symbol,  // canonical symbol 寫入 DB（2330.TW）
          date: normalizedDate,
          open: parseFloat(open.replace(/,/g, "")),
          high: parseFloat(high.replace(/,/g, "")),
          low: parseFloat(low.replace(/,/g, "")),
          close: parseFloat(close.replace(/,/g, "")),
          volume: parseInt(shares.replace(/,/g, "")),
        });
      };

      if (batch.length) {
        tx(batch);
        newlyFetched += batch.length;
        emptyStreak = 0;  // 有資料就清零
        await new Promise((r) => setTimeout(r, 300));  // 禮貌性限速
      } else {
        emptyStreak += 1;
        // 連續空月達門檻 → 多半早於上市，提前結束後續月份
        if (emptyStreak >= EMPTY_BREAK && useBackward) {
          console.log(`ℹ️ 連續 ${EMPTY_BREAK} 個月無資料（可能為早期空月），推測已早於上市，停止向過去回溯`);
          break;
        };
      };
    };

    // 取該股票目前 DB 的最後日期（字串最大即最新）
    const rowMax = db.prepare(
      `SELECT MAX(date) AS maxDate FROM stock_prices WHERE symbol = ?`
    ).get(symbol);

    if (rowMax?.maxDate) {
      const { y: lastY, m: lastM } = ymFromDateStr(rowMax.maxDate);

      // 僅當 DB 最後年月 < 本年月 時才需要補
      if (compareYm(lastY, lastM, todayY, todayM) < 0) {
        for (const { y, m } of iterateMonthsExclusiveNext(lastY, lastM, todayY, todayM)) {
          const like = ymStr(y, m) + "/%";
          const { c } = db.prepare(
            `SELECT COUNT(1) as c FROM stock_prices WHERE symbol = ? AND date LIKE ?`
          ).get(symbol, like);

          const isCurrentMonth = (y === todayY && m === todayM);
          
          // 🛠 修改：同樣套用「今/昨已有資料就略過」
          if (c > 0 && !isCurrentMonth) continue;
          if (c > 0 && isCurrentMonth && hasRecent) continue;
          if (isCurrentMonth && c > 0 && !hasRecent) {
            console.log(`♻️(forward-fill) 重新整理當月 ${symbol} ${y}/${pad(m)}（今/昨無資料）`);
          };

          console.log(`🌐(forward-fill) 抓取 ${symbol} ${y}/${String(m).padStart(2, "0")}`);
          let rows = [];
          try {
            rows = await fetchMonth(code, y, m);
          } catch (err) {
            console.warn(`⚠️(forward-fill) 抓取失敗 ${symbol} ${y}/${String(m).padStart(2,"0")}：${err.message}`);
            rows = [];
          };

          const batch = [];
          for (const r of rows) {
            const [date, shares, , open, high, low, close] = r;
            if (!open || !close) continue;
            const normalizedDate = rocToAd((date || "").trim());
            batch.push({
              symbol,
              date: normalizedDate,
              open: parseFloat(open.replace(/,/g, "")),
              high: parseFloat(high.replace(/,/g, "")),
              low: parseFloat(low.replace(/,/g, "")),
              close: parseFloat(close.replace(/,/g, "")),
              volume: parseInt(shares.replace(/,/g, "")),
            });
          };

          if (batch.length) {
            tx(batch);
            newlyFetched += batch.length;
            await new Promise((r) => setTimeout(r, 300));
          };
        };
      };
    } else {
      // 若該股票完全沒有資料（新股票第一次查）
      // 就以「請求的 startYear/startMonth」當作起點向今天補齊，避免下次還缺段
      const { y: sY, m: sM } = { y: startYear, m: startMonth };
      if (compareYm(sY, sM, todayY, todayM) < 0) {
        for (const { y, m } of iterateMonthsExclusiveNext(sY, sM, todayY, todayM)) {
          const like = ymStr(y, m) + "/%";
          const { c } = db.prepare(
            `SELECT COUNT(1) as c FROM stock_prices WHERE symbol = ? AND date LIKE ?`
          ).get(symbol, like);
          if (c > 0) continue;

          console.log(`🌐(forward-fill:init) 抓取 ${symbol} ${y}/${String(m).padStart(2, "0")}`);
          let rows = [];
          try {
            rows = await fetchMonth(code, y, m);
          } catch (err) {
            console.warn(`⚠️(forward-fill:init) 抓取失敗 ${symbol} ${y}/${String(m).padStart(2,"0")}：${err.message}`);
            rows = [];
          };

          const batch = [];
          for (const r of rows) {
            const [date, shares, , open, high, low, close] = r;
            if (!open || !close) continue;
            const normalizedDate = rocToAd((date || "").trim());
            batch.push({
              symbol,
              date: normalizedDate,
              open: parseFloat(open.replace(/,/g, "")),
              high: parseFloat(high.replace(/,/g, "")),
              low: parseFloat(low.replace(/,/g, "")),
              close: parseFloat(close.replace(/,/g, "")),
              volume: parseInt(shares.replace(/,/g, "")),
            });
          };

          if (batch.length) {
            tx(batch);
            newlyFetched += batch.length;
            await new Promise((r) => setTimeout(r, 300));
          };
        };
      };
    };

    if (newlyFetched) console.log(`💾 新增 ${newlyFetched} 筆`);

    // 回傳「請求範圍」內的所有資料，SELECT 區間要保證「小在前大在後」
    const a = `${startYear}/${String(startMonth).padStart(2, "0")}/01`;
    const b = `${endYear}/${String(endMonth).padStart(2, "0")}/31`;
    const [startDateStr, endDateStr] = a <= b ? [a, b] : [b, a];
    const result = db.prepare(
      `SELECT * FROM stock_prices
       WHERE symbol = ? AND date BETWEEN ? AND ?
       ORDER BY date`
    ).all(symbol, startDateStr, endDateStr);
    res.set("Cache-Control", "no-store");  // 避免前端拿舊 JSON
    return res.json(result);
  } catch (err) {
    console.error("❌ 抓取或儲存錯誤：", err);
    res.status(500).json({ error: "資料抓取失敗", message: err.message });
  };
});


// -------------------------------
//  API：相關新聞（/api/news/:code）
// 依 code 先查本地公司名；先試 GDELT→Google News RSS（免金鑰）
// 回傳：[{ title, url, source, publishedAt, summary }]
// -------------------------------
app.get("/api/news/:code", async (req, res) => {
  const code = String(req.params.code || "").toUpperCase().replace(/\.TW$/, "").trim();
  const days  = Math.max(parseInt(req.query.days || "180", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "30", 10), 1), 100);
  const lang  = (req.query.lang || "zh").toString();  // "zh" | "en"
  const whitelistOnly = String(req.query.whitelistOnly || "0") === "1";  // 白名單

  // 直接從 symbols cache 拿公司名
  let companyName = code;
  const profile = await getSymbol(code, { force: false });
  if (profile?.name) companyName = profile.name;

  function dedupe(items) {
    const seen = new Set();
    return items.filter(it => {
      const key = (it.url || it.title || "").trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };


  // --- 白名單與加權工具（NEW） -------------------------
  function baseHost(u = "", fallback = "") {
    try {
      const h = new URL(u).hostname.toLowerCase();
      return h.replace(/^www\./, "").replace(/^m\./, "");
    } catch {
      return (fallback || "").toLowerCase();
    }
  }

  // 可以在這裡自由增刪，右側數字是權重（越大越優先）
  const WHITE_WEIGHTS = [
    ["cnyes.com", 30], ["news.cnyes.com", 30],
    ["ltn.com.tw", 20],
    ["money.udn.com", 18],
    ["finance.ettoday.net", 16],
    ["technews.tw", 14],
    ["ctee.com.tw", 12],
    ["wealth.businessweekly.com.tw", 12],
  ];

  function weightForHost(host) {
    for (const [domain, w] of WHITE_WEIGHTS) {
      if (host === domain || host.endsWith("." + domain)) return w;
    }
    return 0;  // 非白名單站台
  };
  // ----------------------------------------------------


  // 極小的 RSS 解析器（避免新增依賴）
  function parseRssXml(xml) {
    const items = [];
    const itemRe = /<item\b[\s\S]*?<\/item>/gi;
    const get = (seg, tag) => {
      const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i").exec(seg);
      if (!m) return "";
      return m[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]*>/g, "").trim();
    };
    const decode = (s) => s
      .replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
      .replace(/&quot;/g,'"').replace(/&#39;/g,"'");
    let m;
    while ((m = itemRe.exec(xml))) {
      const seg = m[0];
      const title = decode(get(seg, "title"));
      const link  = decode(get(seg, "link"));
      const src   = decode(get(seg, "source")) || (link ? new URL(link).hostname.replace(/^www\./,"") : "Google News");
      const pub   = get(seg, "pubDate");
      items.push({
        title,
        url: link,
        source: src || "Google News",
        publishedAt: pub ? new Date(pub).toISOString() : null,
        summary: title
      });
    }
    return items;
  }

  // Google News RSS 後備
  async function fetchFromGoogleNews(companyName, code, days, limit, lang) {
    try {
      const term = [`"${companyName}"`, code].filter(Boolean).join(" OR ");
      const q = encodeURIComponent(term);
      const zh = (lang === "zh");
      const url =
        `https://news.google.com/rss/search?q=${q}` +
        `&hl=${zh ? "zh-TW" : "en-US"}&gl=${zh ? "TW" : "US"}&ceid=${zh ? "TW:zh-Hant" : "US:en"}`;

      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) return [];
      const xml = await r.text();
      let arr = parseRssXml(xml);

      // 過濾天數
      const cutoff = Date.now() - days * 24 * 3600 * 1000;
      arr = arr.filter(it => {
        if (!it.publishedAt) return true;
        return +new Date(it.publishedAt) >= cutoff;
      });

      // 依時間新→舊並裁切
      arr.sort((a,b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
      return arr.slice(0, limit);
    } catch (e) {
      console.warn("[news] GoogleNews 失敗：", e?.message || e);
      return [];
    }
  }

  try {
    let items = [];

    // ① GDELT（免金鑰），加強解析容錯
    if (items.length === 0) {
      try {
        const q = encodeURIComponent(companyName);
        const langFilter = lang === "zh" ? " sourcelang:zh" : "";
        const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}${langFilter}&mode=ArtList&format=json&maxrecords=${limit}&timespan=${days}d`;
        const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });

        if (r.ok) {
          const ctype = String(r.headers.get("content-type") || "").toLowerCase();
          let j;
          if (ctype.includes("application/json")) {
            j = await r.json();
          } else {
            // 收到文字/HTML，就不要拋錯；直接視為無資料
            const txt = await r.text();
            if (/{"articles"/i.test(txt)) {
              try { j = JSON.parse(txt); } catch {}
            }
          }
          const arr = Array.isArray(j?.articles) ? j.articles : [];
          for (const it of arr) {
            items.push({
              title: it.title || "",
              url: it.url || it.seurl || "",
              source: it.sourceCommonName || it.domain || "GDELT",
              publishedAt: it.seendate ? new Date(it.seendate).toISOString() : null,
              summary: it.title || ""
            });
          }
        }
      } catch (e) {
        console.warn("[news] GDELT 失敗：", e?.message || e);
      };
    };

    // ② Google News RSS（免金鑰）最後後備
    if (items.length === 0) {
      const rssItems = await fetchFromGoogleNews(companyName, code, days, limit, lang); // NEW
      items.push(...rssItems);
    };

    // 去重、排序、裁切
    items = dedupe(items).map(it => {
      const host = baseHost(it.url, it.source);
      const w = weightForHost(host);
      return { ...it, __host: host, __w: w }; // NEW: 暫放加權資訊
    });

    // 只保留白名單
    const filtered = whitelistOnly ? items.filter(it => it.__w > 0) : items;

    // 先比權重、再比時間（新 → 舊）
    filtered.sort((a, b) => {
      if (b.__w !== a.__w) return b.__w - a.__w;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });

    // 回傳前去掉內部欄位
    const out = filtered.slice(0, limit).map(({ __w, __host, ...rest }) => rest);

    res.set("Cache-Control", "no-store");
    return res.json(out);
  } catch (e) {
    console.error("news route error:", e);
    return res.status(500).json({ error: "news_failed", message: e.message });
  };
});


installSymbolRoutes(app);
installRankingRoutes(app);
installFundamentalRoutes(app, db);  // 把 db 傳進去，讓 fundamentals 能查「最新收盤」


// -------------------------------
//  在 production 服務前端打包好的檔案（Vue dist）
// -------------------------------
const distPath = path.join(__dirname, "..", "frontend", "dist");   // ../frontend/dist

if (fs.existsSync(distPath)) {
  // 提供靜態檔案（JS / CSS / assets）
  app.use(express.static(distPath));

  // 讓 Vue Router 的前端路由都回到 index.html
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}


// -------------------------------
//  啟動伺服器
// -------------------------------
app.listen(PORT, () =>
  console.log(`🚀 SQLite 快取伺服器運行於 http://localhost:${PORT}`)
);
