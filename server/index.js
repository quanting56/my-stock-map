// ===============================
//  Node.js + Express + SQLite 快取伺服器
//  整合前端 Test.vue 的 TWSE 股價 API
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
}

// -------------------------------
//  工具函式：呼叫證交所 API 抓取單月資料
// -------------------------------
async function fetchMonth(symbol, year, month) {
  const date = `${year}${pad(month)}01`;
  const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${date}&stockNo=${symbol}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data || [];
}

// -------------------------------
//  API：查詢某檔股票（例：/api/stocks/2330?startYear=2025&startMonth=1&endMonth=10）
// -------------------------------
app.get("/api/stocks/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const startYear = parseInt(req.query.startYear || "2025");
  const startMonth = parseInt(req.query.startMonth || "1");
  const endMonth = parseInt(req.query.endMonth || "12");

  try {
    // 先檢查快取
    const cached = db
      .prepare(`SELECT * FROM stock_prices WHERE symbol = ? ORDER BY date`)
      .all(symbol);

    if (cached.length > 0) {
      console.log(`✅ 使用快取資料 (${symbol})`);
      return res.json(cached);
    }

    // 沒快取 → 從證交所逐月抓取
    console.log(`🌐 從 TWSE 取得資料 (${symbol}, ${startYear}/${startMonth}~${endMonth})`);
    let allData = [];

    for (let m = startMonth; m <= endMonth; m++) {
      const rows = await fetchMonth(symbol, startYear, m);
      for (const r of rows) {
        const [date, shares, , open, high, low, close] = r;
        if (!open || !close) continue;
        allData.push({
          symbol,
          date,
          open: parseFloat(open.replace(/,/g, "")),
          high: parseFloat(high.replace(/,/g, "")),
          low: parseFloat(low.replace(/,/g, "")),
          close: parseFloat(close.replace(/,/g, "")),
          volume: parseInt(shares.replace(/,/g, "")),
        });
      }
      await new Promise((r) => setTimeout(r, 300)); // 防止短時間多次請求被擋
    }

    // 寫入 SQLite 快取
    const insert = db.prepare(`
      INSERT OR REPLACE INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES (@symbol, @date, @open, @high, @low, @close, @volume)
    `);
    const tx = db.transaction((records) => records.forEach((r) => insert.run(r)));
    tx(allData);

    console.log(`💾 已儲存 ${allData.length} 筆資料至 SQLite`);
    res.json(allData);
  } catch (err) {
    console.error("❌ 抓取或儲存錯誤：", err);
    res.status(500).json({ error: "資料抓取失敗", message: err.message });
  }
});

// -------------------------------
//  啟動伺服器
// -------------------------------
app.listen(PORT, () =>
  console.log(`🚀 SQLite 快取伺服器運行於 http://localhost:${PORT}`)
);
