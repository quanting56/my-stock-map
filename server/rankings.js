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

// 解析一個 TAIFEX 表格頁：每列通常是 [排行, 名稱, 比重]×2 組
function parseTaifexTable(html, market){
  const $ = cheerio.load(html);
  const out = [];
  $("table tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 3) return;
    const cells = tds.toArray().map(td => $(td).text().replace(/\s+/g," ").trim());
    // 以 3 格為一組掃過去
    for (let i=0; i+2<cells.length; i+=3) {
      const rank = Number(cells[i]);
      const name = cells[i+1];
      const weightStr = cells[i+2].replace(/[%％]/g,"");
      if (!Number.isFinite(rank) || !name) continue;
      const weight = Number(weightStr); // 可能為 NaN (非必要欄)
      out.push({ market, rank, name, weight: Number.isFinite(weight)? weight : null });
    }
  });
  return out;
}

async function fetchRanksOnce(){
  const twseHtml = await (await fetch(TWSE_URL, { headers: UA })).text();
  const tpexHtml = await (await fetch(TPEX_URL, { headers: UA })).text();
  const twse = parseTaifexTable(twseHtml, "TWSE");
  const tpex = parseTaifexTable(tpexHtml, "TPEX");

  // 嘗試把名稱對上你既有的 symbols 快取（由 symbolMap 產生）
  let symbols = [];
  try { symbols = JSON.parse(fs.readFileSync(path.join("data","symbols.json"), "utf-8")); } catch {}
  const byName = new Map(symbols.map(s => [normalizeName(s.name), s]));

  const attach = (row) => {
    const hit = byName.get(normalizeName(row.name));
    return hit ? { ...row, code: hit.code, symbol: hit.symbol } : row;
  };

  return {
    date: new Date().toISOString().slice(0,10),
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
