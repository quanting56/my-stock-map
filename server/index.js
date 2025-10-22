// ===============================
//  Node.js + Express + SQLite 快取伺服器
//  整合前端 Dashboard/PerformanceChart.vue 的 TWSE 股價 API
// ===============================

import express from "express";
import fetch from "node-fetch";
import Database from "better-sqlite3";
import fs from "fs";
import cors from "cors";

// -------------------------------
//  初始化基本設定
// -------------------------------
const app = express();
const PORT = 3000;
const dbDir = "./data";
const dbPath = `${dbDir}/stocks.db`;

// 啟用 CORS（允許前端 http://localhost:5173 存取）
app.use(cors({ origin: "http://localhost:5173" }));

// 若沒有資料夾就建立
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);

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

// -------------------------------
//  工具函式：呼叫證交所 API 抓取單月資料
// -------------------------------
async function fetchMonth(symbol, year, month) {
  const date = `${year}${pad(month)}01`;
  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${symbol}`;
  // 加 UA，降低被重導阻擋的機率
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept": "application/json,text/plain,*/*",
      "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
    },
    redirect: "follow"
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

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

// -------------------------------
//  API：查詢某檔股票（例：/api/stocks/2330?startYear=2025&startMonth=1&endMonth=10）
// -------------------------------
app.get("/api/stocks/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const startYear = parseInt(req.query.startYear || "2025");
  const startMonth = parseInt(req.query.startMonth || "1");
  const endYear = parseInt(req.query.endYear || String(startYear));
  const endMonth = parseInt(req.query.endMonth || "12");
  const directionParam = (req.query.direction || "auto").toString();  // "forward" | "backward" | "auto"

  // 從這邊往後繼續處理程式碼
  try {
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

    // 決定抓取方向（向前或向後月份）
    const useBackward =
      directionParam === "backward" ||
      (directionParam === "auto" && compareYm(startYear, startMonth, endYear, endMonth) > 0);
    console.log(
      `➡️ 抓取方向：${useBackward ? "backward" : "forward"} | 範圍：${startYear}/${String(startMonth).padStart(2,"0")} ~ ${endYear}/${String(endMonth).padStart(2,"0")}`
    );
    const iter = useBackward
      ? iterateMonthsDesc(startYear, startMonth, endYear, endMonth)
      : iterateMonths(startYear, startMonth, endYear, endMonth);

    for (const { y, m } of iter) {
      const like = ymStr(y, m) + "/%";
      const { c } = db.prepare(
        `SELECT COUNT(1) as c FROM stock_prices WHERE symbol = ? AND date LIKE ?`
      ).get(symbol, like);
      if (c > 0) continue;  // 該月份已有快取

      console.log(`🌐 抓取 ${symbol} ${y}/${String(m).padStart(2, "0")}`);
      let rows = [];
      try {
        rows = await fetchMonth(symbol, y, m);
      } catch (err) {
        // 單月錯誤不讓整體中斷，紀錄並當作空月處理
        console.warn(`⚠️ 抓取失敗 ${symbol} ${y}/${String(m).padStart(2,"0")}：${err.message}`);
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
        emptyStreak = 0;  // 有資料就清零
        await new Promise((r) => setTimeout(r, 300));  // 禮貌性限速
      } else {
        emptyStreak += 1;
        // 連續空月達門檻 → 多半早於上市，提前結束後續月份
        if (emptyStreak >= EMPTY_BREAK) {
          console.log(`ℹ️ 連續 ${EMPTY_BREAK} 個月無資料（可能為早期空月），推測已早於上市，停止往前抓取`);
          break;
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
    return res.json(result);
  } catch (err) {
    console.error("❌ 抓取或儲存錯誤：", err);
    res.status(500).json({ error: "資料抓取失敗", message: err.message });
  };
});

// -------------------------------
//  啟動伺服器
// -------------------------------
app.listen(PORT, () =>
  console.log(`🚀 SQLite 快取伺服器運行於 http://localhost:${PORT}`)
);
