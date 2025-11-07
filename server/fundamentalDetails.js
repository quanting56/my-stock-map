// ===============================
// 基本面路由（TWSE：PE/PB/殖利率 + 股本 + 以收盤估 TTM EPS）
// ===============================
import fetch from "node-fetch";

// 小工具：yyyyMMdd
function fmtYYYYMMDD(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${dd}`;
}

// 共用：字串轉數字（遇到 '—' / 'N/A' 會回 null）
function toNum(x) {
  const n = Number(String(x ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

// === NEW: 直接用單檔端點（最近交易日）========================
// /exchangeReport/BWIBBU?response=json&stockNo=2330
async function fetchBwibbuLatestByStock(code) { // NEW
  const url = `https://www.twse.com.tw/exchangeReport/BWIBBU?response=json&stockNo=${code}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`BWIBBU HTTP ${res.status}`);
  const j = await res.json();

  const fields = Array.isArray(j?.fields) ? j.fields : [];
  const data = Array.isArray(j?.data) ? j.data : [];
  if (!fields.length || !data.length) return null;

  const idxPe = fields.findIndex((f) => /本益比/.test(f));
  const idxPb = fields.findIndex((f) => /股價淨值比/.test(f));
  const idxDy = fields.findIndex((f) => /殖利率/.test(f) && /%/.test(f));
  const r = data[0];

  const pe = idxPe >= 0 ? toNum(r[idxPe]) : null;
  const pb = idxPb >= 0 ? toNum(r[idxPb]) : null;
  const dyPct = idxDy >= 0 ? toNum(r[idxDy]) : null;

  return {
    peRatio: pe,
    pbRatio: pb,
    yield: dyPct != null ? dyPct / 100 : null, // 小數回傳，前端 *100 顯示
  };
}

// === FIX: 這個是 BWIBBU_d（某日全市場清單）的「單檔過濾版」 =========
async function fetchBwibbuByDate(code, yyyymmdd) { // CHANGED
  const url = `https://www.twse.com.tw/exchangeReport/BWIBBU_d?response=json&date=${yyyymmdd}`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, redirect: "follow" });
  if (!res.ok) throw new Error(`BWIBBU_d HTTP ${res.status}`);
  const j = await res.json();

  const fields = Array.isArray(j?.fields) ? j.fields : [];
  const data = Array.isArray(j?.data) ? j.data : [];
  if (!fields.length || !data.length) return null;

  const idxCode = fields.findIndex((f) => /代號/.test(f));
  const idxPe   = fields.findIndex((f) => /本益比/.test(f));
  const idxPb   = fields.findIndex((f) => /股價淨值比/.test(f));
  const idxDy   = fields.findIndex((f) => /殖利率/.test(f) && /%/.test(f));

  // 找到該代碼那一列（某些日子欄位可能是純代號，某些日子可能含名稱，兩者都容忍）
  let row = null;
  if (idxCode >= 0) {
    row = data.find(r => {
      const cell = String(r[idxCode] ?? "").trim();
      return cell === code || cell.startsWith(`${code} `);
    });
  }
  // 若欄位名稱沒「代號」，就掃每列每格找 '2330' 開頭（保險）
  if (!row) {
    row = data.find(r => r?.some?.(c => {
      const s = String(c ?? "").trim();
      return s === code || s.startsWith(`${code} `);
    }));
  }
  if (!row) return null;

  const pe = idxPe >= 0 ? toNum(row[idxPe]) : null;
  const pb = idxPb >= 0 ? toNum(row[idxPb]) : null;
  const dyPct = idxDy >= 0 ? toNum(row[idxDy]) : null;

  return {
    peRatio: pe,
    pbRatio: pb,
    yield: dyPct != null ? dyPct / 100 : null,
  };
}

// === CHANGED: 先用單檔端點；失敗才回溯 10 天用 _d 清單過濾 =========
async function fetchBwibbuLatest(code) { // CHANGED
  // 1) 優先：單檔最近交易日
  try {
    const hit = await fetchBwibbuLatestByStock(code);
    if (hit) return hit;
  } catch (_) {}

  // 2) 後備：往前找 10 天的 BWIBBU_d 清單並過濾
  let d = new Date();
  for (let i = 0; i < 10; i++) {
    const ymd = fmtYYYYMMDD(d);
    const hit = await fetchBwibbuByDate(code, ymd).catch(() => null);
    if (hit) return hit;
    d.setDate(d.getDate() - 1);
  }
  return { peRatio: null, pbRatio: null, yield: null };
}

// === 股本（同你原本） =========================================
async function fetchShareCapital(code) {
  const url = "https://openapi.twse.com.tw/v1/opendata/t187ap03_L";
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`t187ap03_L HTTP ${res.status}`);
  const arr = await res.json();

  const hit = arr.find(
    (r) => String(r?.["公司代號"] ?? r?.["公司代碼"] ?? "").trim() === String(code)
  );
  if (!hit) return null;

  const raw = hit?.["實收資本額(元)"] ?? hit?.["實收資本額"] ?? null;
  return raw != null ? toNum(raw) : null;
}

// === 從 DB 取最新收盤（用來估 TTM EPS）=========================
function getLatestCloseFromDb(db, code) {
  if (!db) return null;
  const row = db
    .prepare(`SELECT close FROM stock_prices WHERE symbol=? ORDER BY date DESC LIMIT 1`)
    .get(code);
  return toNum(row?.close);
}

export function installFundamentalRoutes(app, db) {
  app.get("/api/fundamentals/:code", async (req, res) => {
    const code = String(req.params.code || "")
      .toUpperCase()
      .replace(/\.TW$/, "")
      .trim();

    try {
      // 1) 取最近交易日的 PE/PB/殖利率（單檔端點，失敗再 fallback）
      const bw = await fetchBwibbuLatest(code); // CHANGED

      // 2) 股本
      const shareCapital = await fetchShareCapital(code);

      // 3) EPS（近四季，保守估）：有 close 與 PE 才估
      const latestClose = getLatestCloseFromDb(db, code);
      const epsTTM = (Number.isFinite(bw.peRatio) && Number.isFinite(latestClose) && bw.peRatio > 0)
        ? Number((latestClose / bw.peRatio).toFixed(2))
        : null;

      // 防快取（避免不同代碼拿到同一份 JSON）
      res.set("Cache-Control", "no-store"); // ensure no-store

      return res.json({
        peRatio: bw.peRatio ?? null,
        pbRatio: bw.pbRatio ?? null,
        yield: bw.yield ?? null,               // 小數（例如 0.047）
        shareCapital: shareCapital ?? null,    // 元
        eps: epsTTM,                           // 近四季估
      });
    } catch (e) {
      console.error("[fundamentals] error:", e);
      return res.status(500).json({ error: "fundamentals_failed", message: e?.message || String(e) });
    }
  });
}
