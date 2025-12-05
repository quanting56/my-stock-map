// 以 TAIFEX 頁面當來源產生「市值排名」API
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import fs from "fs";
import path from "path";

const UA = {
  "User-Agent": "Mozilla/5.0",
  "Accept": "text/html,application/xhtml+xml",
};

const TWSE_URL = "https://www.taifex.com.tw/cht/9/futuresQADetail";       // 上市（TAIEX） 來源
const TPEX_URL = "https://www.bq888.taifex.com.tw/cht/2/tPEXPropertion";  // 上櫃（OTC）   來源

const DATA_DIR = path.join("data");
const CACHE_FILE = path.join(DATA_DIR, "market_ranks.json");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function normalizeName(s=""){ return s.replace(/\s+/g,"").trim(); }

// 從整個 HTML 字串裡把「資料日期：YYYY/MM/DD」抓出來
function extractDataDate(html = "") {
  // 例：<p>資料日期：2025/11/28</p>
  const m = html.match(/資料日期：\s*(\d{4})[\/\-](\d{2})[\/\-](\d{2})/);
  if (!m) return null;
  const [, y, mm, dd] = m;
  // 前端只是顯示文字，所以維持 "YYYY/MM/DD" 就好
  return `${y}/${mm}/${dd}`;
}

// 解析一個 TAIFEX 表格頁：每列通常是 [排行, 名稱, 比重]×2 組
function parseTaifexTable(html, market){
  const $ = cheerio.load(html);
  const out = [];
  $("table tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;
    const cells = tds.toArray().map(td => $(td).text().replace(/\s+/g," ").trim());
    // 以 3 格為一組掃過去
    for (let i = 0; i + 3 < cells.length; i += 4) {
      const rank = Number(cells[i]);
      const code = cells[i + 1];
      const name = cells[i + 2];
      const weightStrRaw = cells[i + 3];

      if (!Number.isFinite(rank) || !code || !name) continue;

      const weightStr = weightStrRaw.replace(/[%％]/g, "");
      const w = Number(weightStr);
      const weight = Number.isFinite(w) ? w : null; // 例如 14.3219

      out.push({
        market,
        rank,
        code,                 // 例如 "2330"
        symbol: `${code}.TW`, // 例如 "2330.TW"
        name,                 // 例如 "台積電"
        weight,               // 例如 14.3219（百分比）
      });
    }
  });
  return out;
}

async function fetchRanksOnce(){
  const twseHtml = await (await fetch(TWSE_URL, { headers: UA })).text();
  const tpexHtml = await (await fetch(TPEX_URL, { headers: UA })).text();
  const twse = parseTaifexTable(twseHtml, "TWSE");
  const tpex = parseTaifexTable(tpexHtml, "TPEX");

  // 嘗試從 HTML 解析「資料日期」
  const dataDate =
    extractDataDate(twseHtml) ||
    extractDataDate(tpexHtml) ||
    new Date().toISOString().slice(0, 10).replace(/-/g, "/"); // 兜底

  // 嘗試把名稱對上你既有的 symbols 快取（由 symbolMap 產生）
  let symbols = [];
  try { symbols = JSON.parse(fs.readFileSync(path.join("data","symbols.json"), "utf-8")); } catch {}
  const byName = new Map(symbols.map(s => [normalizeName(s.name), s]));

  const attach = (row) => {
    // 如果本來就有 code/symbol，就不要再用名稱去對照覆蓋
    if (row.code && row.symbol) return row;

    const hit = byName.get(normalizeName(row.name));
    return hit ? { ...row, code: hit.code, symbol: hit.symbol } : row;
  };

  return {
    date: dataDate,  // TAIFEX「資料日期」（例如 "2025/11/28"）
    fetchedAt: new Date().toISOString(),  // 除錯用，看你什麼時候抓的
    twse: twse.map(attach),
    tpex: tpex.map(attach)
  };
}

let cache = null;
let lastAt = 0;
const TTL = 24*60*60*1000; // 24h

async function ensureCache(force=false){
  const now = Date.now();
  if (!cache && fs.existsSync(CACHE_FILE) && !force) {
    try { cache = JSON.parse(fs.readFileSync(CACHE_FILE,"utf-8")); lastAt = now; } catch {}
  }
  if (force || !cache || (now-lastAt)>TTL) {
    cache = await fetchRanksOnce();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache,null,2), "utf-8");
    lastAt = now;
  }
  return cache;
}

export function installRankingRoutes(app){
  // 全部
  app.get("/api/market-ranks", async (req,res) => {
    try {
      const force = String(req.query.force||"") === "1";
      const data = await ensureCache(force);
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "rank_fetch_failed", message: e.message });
    }
  });

  // 查單檔 rank（用代碼或名稱）
  app.get("/api/market-ranks/:q", async (req,res) => {
    try {
      const q = String(req.params.q||"").toUpperCase().replace(/\.TW$/,"").trim();
      const data = await ensureCache(false);
      const hay = [...data.twse, ...data.tpex];
      const hit = hay.find(r =>
        String(r.code||"") === q ||
        String(r.symbol||"").toUpperCase().replace(/\.TW$/,"") === q ||
        normalizeName(r.name).toUpperCase() === normalizeName(q).toUpperCase()
      );
      if (!hit) return res.status(404).json({ error: "not_found" });
      res.json(hit);
    } catch (e) {
      res.status(500).json({ error: "rank_lookup_failed", message: e.message });
    }
  });
}
