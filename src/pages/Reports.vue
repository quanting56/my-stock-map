<template>
  <LoadingModal :open="isGenerating" message="報表生成中"></LoadingModal>
  <div class="p-6">
    <!-- 頁面標題 + Controls -->
    <HeaderAndControls
      v-model:from="from"
      v-model:to="to"
      v-model:selectedTemplate="selectedTemplate"
      :templates="templates"
      :busy="isGenerating"
      @generateReport="generateReport"
    ></HeaderAndControls>
    

    <!-- 一樓：Summary Cards -->
    <SummaryCards
      :lastReport="lastReport"
      :exportCount="exportCount"
      :scheduled="scheduled"
      :lastRunTime="lastRunTime"
    ></SummaryCards>
    

    <!-- 二樓：報表預覽/匯出＋最近匯出與預設任務 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- 報表預覽/匯出 -->
      <ReportPreview
        :latestGenerated="latestGenerated"
        :downloadCSV="downloadCSV"
        :downloadJSON="downloadJSON"
        :downloadPDF="downloadPDF"
      ></ReportPreview>


      <!-- 最近匯出與預設任務 -->
      <ExportAndPresetLists
        :recentExports="recentExports"
        :scheduled="scheduled"
        :fmtDate="fmtDate"
        :downloadCSV="downloadCSV"
        :downloadPDF="downloadPDF"
        :runNow="runNow"
      ></ExportAndPresetLists>
    </div>

    <!-- 三樓：報表匯入 -->
    <ReportImport
      :onUpload="onUpload"
      :openTemplateEditor="openTemplateEditor"
    ></ReportImport>
  </div>
</template>

<script setup>
import LoadingModal from "@/components/Common/LoadingModal.vue"
import HeaderAndControls from "@/components/Reports/HeaderAndControls.vue";
import SummaryCards from "@/components/Reports/SummaryCards.vue";
import ReportPreview from "@/components/Reports/ReportPreview.vue";
import ExportAndPresetLists from "@/components/Reports/ExportAndPresetLists.vue";
import ReportImport from "@/components/Reports/ReportImport.vue";

import { ref, reactive } from "vue";
import { usePortfolioStore } from "@/store/portfolio.js";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// 讀取 .ttf → base64 → 註冊給 jsPDF（給 downloadPDF() 用）
async function ensureChineseFont(doc) {
  // 小工具：載入一個 ttf 並轉成 base64
  const loadFontAsBase64 = async (url) => {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[ensureChineseFont] 載入字型失敗：", url, res.status, res.statusText);
      throw new Error(`Failed to load font: ${url}`);
    }

    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // 迴圈一個一個累加成字串再丟給 btoa
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  };

  // 同步載入兩個字型檔（Regular -> normal / Bold -> bold）
  const [
    regularB64,
    boldB64
  ] = await Promise.all([
    loadFontAsBase64(`${import.meta.env.BASE_URL || "/"}fonts/TaipeiSansTCBeta-Regular.ttf`),
    loadFontAsBase64(`${import.meta.env.BASE_URL || "/"}fonts/TaipeiSansTCBeta-Bold.ttf`)
  ]);

  // 加進 jsPDF 的 VFS
  doc.addFileToVFS("TaipeiSansTCBeta-Regular.ttf", regularB64);
  doc.addFileToVFS("TaipeiSansTCBeta-Bold.ttf", boldB64);

  doc.addFont("TaipeiSansTCBeta-Regular.ttf", "TaipeiSansTCBeta", "normal");
  doc.addFont("TaipeiSansTCBeta-Bold.ttf", "TaipeiSansTCBeta", "bold");
}



const isGenerating = ref(false);

const portfolioStore = usePortfolioStore();

const today = new Date();
const lastYearToday = new Date(new Date(today).setFullYear(today.getFullYear() - 1));
function fmtDate(date) {  // 把 Date 轉換成 <input type="date"> 看得懂的格式
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const from = ref(fmtDate(lastYearToday));   // 預設從去年今天
const to = ref(fmtDate(today));             // 預設到今天


// 報表內容（columns 用來定義「欄位 key、顯示名稱(label)、對齊」）
const templates = [
  {
    id: "summary",  // Dashboard 內容為主
    name: "Summary（總覽）",
    columns: [
      { key: "from",             label: "起始日",   align: "left",  format: null },  // format 用來讓 ReportPreview 決定要不要套用 fmt格式
      { key: "to",               label: "終止日",   align: "left",  format: null  },
      { key: "totalMarketValue", label: "總市值",   align: "right", format: "fmtCurrency" },
      { key: "totalPnlPct",      label: "總報酬率", align: "right", format: "fmtPct" },
      { key: "companiesHeld",    label: "持股檔數", align: "right", format: null }
    ]
  },          // 修到 templates 和 各頁面 rows 處，還要調整 rows 和 columns 的對應
  {
    id: "positions",  // Portfolio 內容為主
    name: "Positions（持倉明細）",
    columns: [
      { key: "name",        label: "股票名稱", align: "left",  format: null },
      { key: "ticker",      label: "股票代號", align: "left",  format: null },
      { key: "shares",      label: "持股",    align: "right", format: "threeDigitSeparator" },
      { key: "cost",        label: "成本",    align: "right", format: "fmtCurrency" },
      { key: "price",       label: "現價",    align: "right", format: "fmtCurrency" },
      { key: "marketValue", label: "市值",    align: "right", format: "fmtCurrency" },
      { key: "pnlPct",      label: "損益%",   align: "right", format: "fmtPct" }
    ]
  },
  {
    id: "trades",  // （尚未開放）
    name: "Trades（交易紀錄）",
    columns: [
      { key: "datetime", label: "時間",   align: "left",  format: null },
      { key: "ticker",   label: "股票",   align: "left",  format: null },
      { key: "side",     label: "買賣別", align: "left",  format: null },
      { key: "qty",      label: "股數",   align: "right", format: "threeDigitSeparator" },
      { key: "price",    label: "成交價", align: "right", format: "fmtCurrency" },
      { key: "fee",      label: "手續費", align: "right", format: "fmtCurrency" },
      { key: "tax",      label: "交易稅", align: "right", format: "fmtCurrency" },
      { key: "net",      label: "淨額",   align: "right", format: "fmtCurrency" }
    ]
  },
  {
    id: "blank",  // 自訂欄位
    name: "Blank（空白報表）",
    columns: []
  }
];
const selectedTemplate = ref(templates[0].id);


// 產生與匯出紀錄
const exportCount = ref(0);
const recentExports = ref([]);

const scheduled = reactive([
  { id: "s1", name: "近一個月報表", rangeType: "1m",from: new Date(new Date(today).setMonth(today.getMonth() - 1)), to: today, template: "Summary" },
  { id: "s2", name: "近一季度報表", rangeType: "3m",from: new Date(new Date(today).setMonth(today.getMonth() - 3)), to: today, template: "Positions" },
  { id: "s3", name: "近半年度報表", rangeType: "6m",from: new Date(new Date(today).setMonth(today.getMonth() - 6)), to: today, template: "Positions" }
]);

const lastReport = ref(null);      // 最後產生報告之種類
const lastRunTime = ref(null);     // 最後產生報告之時刻

/* Latest Generated Report */
const latestGenerated = ref(null);

/* 產生報表的函式 */
async function generateReport() {
  isGenerating.value = true;
  const startTime = (performance?.now ? performance.now() : Date.now());

  try {
    const now = new Date();
    const tpl = templates.find(t => t.id === selectedTemplate.value);
    const columns = tpl.columns;

    // 先從 store 取出「目前持股」資料（已自動從 localStorage 或 mockData 載入）
    const allHoldings = portfolioStore.holdingDetailsData;
    const allStockHoldings = allHoldings.filter(h => h.id !== null);  // 砍掉「現金」那筆，僅保留股票/ETF

    const totalMarketValue = portfolioStore.totalValueExCash;  // 總市值（排除現金）
    const totalPnlPct = portfolioStore.overallReturnPercent;   // 總報酬率
    const companiesHeld = allStockHoldings.length;             // 持有公司數

    let rows = [];

    if (tpl.id === "summary") {

      // 給 預覽 和 CSV 用的欄位（downloadCSV 對應的 header）
      rows = [
        {
          from: from.value || null,             // 報表起始時間
          to: to.value || null,                 // 報表終末時間
          totalMarketValue,                     // 排除現金後的持股總市值
          totalPnlPct,                          // 總報酬率
          companiesHeld,                        // 持有公司數
        }
      ];
    } else if (tpl.id === "positions") {
      rows = allStockHoldings.map(h => {
        const shares = Number(h.shares) || 0;       // 持股
        const price = Number(h.price) || 0;         // 當下股價
        const costPerShare = Number(h.cost) || 0;   // 每股成本
        const marketValue = Number(h.stockValue ?? (shares * price) ?? 0);  // 市值
        const pnlPct = (price - costPerShare) / costPerShare;  // 單檔報酬率

        return {
          ticker: h.id,           // 股票代號（ex: 2330.TW）
          marketValue,            // 市值
          pnlPct,                 // 單檔報酬率
          name: h.name,           // 股票名稱
          shares,                 // 持股
          price,                  // 當下股價
          cost: costPerShare      // 每股成本
        };
      });
    } else if (tpl.id === "trades") {  // Trades / Blank 目前先當作空殼，之後要接交易紀錄再補
      rows = [];  // TODO：未來串「交易紀錄」資料
    } else if (tpl.id === "blank") {
      rows = [];  // TODO：給自訂欄位報表用
    }

    // 組成報表物件，供 ReportPreview + CSV/PDF 共用
    const r = {
      id: `r-${now.getTime()}`,
      template: tpl.id,
      name: tpl.name,                // Summary / Positions / Trades / Blank
      date: now,    // 報表產生時刻
      range: { from: from.value, to: to.value },  // 報表起訖時刻
      totalMarketValue,              // 總市值（排除現金）
      totalPnlPct,                   // 總報酬率
      columns,                       // 直欄，要輸出哪些東西
      rows                           // 橫列，每個項目的每個細項是什麼
    };

    latestGenerated.value = r;
    lastReport.value = {
      name: r.name,       // 報表名稱
      date: r.date        // 報名產生時刻
    };


    // 最近匯出清單（先當「最近產生報表」的 log 用）
    recentExports.value.unshift(r);
    if (recentExports.value.length > 8) recentExports.value.pop();

    exportCount.value++;

    // 更新 last run time：實際耗時（秒，保留2位小數）
    const endTime = (performance?.now ? performance.now() : Date.now());
    lastRunTime.value = ((endTime - startTime) / 1000);
  } catch (e) {
    console.error("[Reports] generateReport error:", e);
    alert("報表產生失敗，請稍後再試。");
  } finally {
    isGenerating.value = false;
  }
}


// 下載 CSV 函式
function downloadCSV(report, options = { includeMeta: true }) {
  if (!report) return alert("沒有可匯出的報表");

  // （防呆）沒有 columns / rows 的話，直接提醒，不要讓 .map 爆掉
  if (!Array.isArray(report.columns) || !Array.isArray(report.rows)) {
    return alert("這筆匯出紀錄缺少詳細內容，請重新產生報表後再匯出。");
  }

  const headerKeys = report.columns.map(c => c.key);
  const headerLabels = report.columns.map(c => c.label);

  const lines = [];

  // 有啟用 meta raw 的狀態
  if ( options.includeMeta ) {
    lines.push(`# name: ${report.name}`);
    lines.push(`# generatedAt: ${new Date(report.date).toLocaleString()}`);
    lines.push(`# range: ${report.range.from || ""} ~ ${report.range.to || ""}`);
    lines.push(`# totalMarketValue: $${report.totalMarketValue || ""}`);
    lines.push(`# totalPnlPct: ${(report.totalPnlPct*100).toFixed() || ""}%`);
  }

  lines.push(headerLabels.join(","));
  for (const r of report.rows) {
    const rowLine = headerKeys.map((key) => {
                                const v = r[key] ?? "";
                                // 簡單處理一下逗號 / 換行，若有逗號就用雙引號包起來
                                const s = String(v);
                                return s.includes(",") || s.includes("\n")
                                  ? `"${s.replace(/"/g, '""')}"`
                                  : s;
                              })
                              .join(",");
    lines.push(rowLine);
  }

  const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${report.name || "report"}-${Date.now()}.csv`;
  a.click();

  setTimeout(() => URL.revokeObjectURL(a.href), 200);
  a.remove();
}


// 下載 JSON 函式
function downloadJSON(report, options = { pretty: true }) {
  if (!report) return alert("沒有可匯出的報表");

  // （防呆）沒有 columns / rows 的話，直接提醒，不要讓 .map 爆掉
  if (!Array.isArray(report.columns) || !Array.isArray(report.rows)) {
    return alert("這筆匯出紀錄缺少詳細內容，請重新產生報表後再匯出。");
  }

  // 準備要輸出的 payload（從 report 摘要出來）
  const payload = {
    id: report.id,
    template: report.template,
    name: report.name,
    generatedAt: report.date.toISOString(),
    range: report.range,
    totalMarketValue: report.totalMarketValue,
    totalPnlPct: report.totalPnlPct,
    columns: report.columns,
    rows: report.rows
  };

  // pretty 為 true 的狀態（美化縮排，false 時就輸出一行）
  const jsonText = options.pretty
    ? JSON.stringify(payload, null, 2)
    : JSON.stringify(payload);

  const blob = new Blob([jsonText], { type: "application/json;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${report.name || "report"}-${Date.now()}.json`;  // ★ 副檔名改成 .json
  a.click();

  setTimeout(() => URL.revokeObjectURL(a.href), 200);
  a.remove();
}


// 下載 PDF 函式
async function downloadPDF(report) {
  if (!report) return alert("沒有可匯出的報表");

  // 準備欄位定義
  const headerKeys = report.columns.map(c => c.key);
  const headerLabels = report.columns.map(c => c.label);

  // 建立 jsPDF 實例（A4 直式，單位用 pt）
  const doc = new jsPDF({
    unit: "pt",               // 座標單位
    format: "a4",             // 紙張大小
    orientation: "portrait"   // 頁面方向（此為直式）
  });

  // 先確保中文字型可用
  await ensureChineseFont(doc);

  const marginX = 40;
  const marginY = 40;
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = marginY;

  // 小工具：換頁檢查
  const ensureLine = (needed = 16) => {
    if (y + needed > pageHeight - marginY) {
      doc.addPage();
      y = marginY;
    }
  };


  // 報表標題
  doc.setFontSize(9);
  doc.setFont("TaipeiSansTCBeta", "normal");
  doc.text("報表名稱 ——", marginX, y);
  y += 18;

  doc.setFontSize(16);
  doc.setFont("TaipeiSansTCBeta", "bold");
  doc.text(report.name, marginX, y);
  y += 14;

  doc.setFontSize(6);
  doc.setFont("TaipeiSansTCBeta", "normal");
  doc.text(`此報表產生時刻：${report.date.toLocaleString()}`, marginX, y);
  y += 24;

  
  // Meta 區塊
  doc.setFontSize(10);
  // doc.setFont("TaipeiSansTCBeta", "normal");  // 前面宣告過了，不用重複宣告
  const metaLines = [
    `區間： ${report.range.from} ~ ${report.range.to}`,
    `總市值（區間最末日）： $${report.totalMarketValue.toLocaleString()}`,
    `總損益（此區間）： ${report.totalPnlPct > 0 ? "+" : ""}${(report.totalPnlPct * 100).toFixed(2)}%`
  ];
  metaLines.forEach(line => {
    ensureLine();
    doc.text(line, marginX, y);
    y += 14;
  });


  // 空一行
  y += 16;


  // 準備 autoTable 的 body
  const body = report.rows.map((row) =>
    headerKeys.map(key => String(row[key]))
  );


  // 呼叫 autoTable
  autoTable(doc, {
    startY: y,                 // 從剛剛算好的 y 開始畫表
    head: [headerLabels],      // 第一列是表頭
    body,                      // 表格內容（原始文字會被 didParseCell override 掉）
    styles: {
      font: "TaipeiSansTCBeta",
      fontStyle: "normal",
      fontSize: 9,
      cellPadding: 4
    },
    headStyles: {
      font: "TaipeiSansTCBeta",
      fontStyle: "bold",
      fillColor: [240, 240, 240],
      textColor: 20
    },

    // 每一個 cell 都會經過這裡，可以動態調整對齊、文字與顏色
    didParseCell(data) {
      const colDef = report.columns[data.column.index];
      if (!colDef) return;

      // head + body 一起依照 columns.align 設定 halign
      if (colDef.align === "right") {
        data.cell.styles.halign = "right";
      } else if (colDef.align === "center") {
        data.cell.styles.halign = "center";
      } else {
        data.cell.styles.halign = "left";
      }

      // 只有 body 才需要做「數值格式化 + 顏色」
      if (data.section !== "body") return;

      // 透過 row.index 反查原始 report.rows，拿到 raw 值
      const rowObj = report.rows[data.row.index];
      const rawVal = rowObj[colDef.key];

      let text = "";
      let textColor = data.cell.styles.textColor; // 保留原本 default

      if (rawVal == null) {
        text = "";
      } else if (colDef.format === "fmtCurrency") {
        const n = Number(rawVal) || 0;
        text = "$" + n.toLocaleString();  // 類似預覽中的 $1,899
      } else if (colDef.format === "fmtPct") {
        const n = Number(rawVal) || 0;
        const sign = n > 0 ? "+" : "";
        text = sign + (n * 100).toFixed(2) + "%";  // 類似 +50.2% / -16.0%

        // 顏色：正報酬紅色、負報酬綠色、0 則維持預設
        if (n > 0) {
          textColor = [239, 68, 68];  // 類似 Tailwind green-500
        } else if (n < 0) {
          textColor = [34, 197, 94];  // 類似 Tailwind red-500
        }
      } else if (colDef.format === "threeDigitSeparator") {
        const n = Number(rawVal) || 0;
        text = n.toLocaleString();  // 類似 108,344 這種
      } else {
        // 一般文字欄位
        text = String(rawVal);
      }

      // 把 cell 內容替換成我們客製的文字
      data.cell.text = [text];

      // 套用客製顏色（若有變更）
      if (textColor != null) {
        data.cell.styles.textColor = textColor;
      }
    }
  });
  

  // 下載 PDF 檔案
  const fileName = `${report.name}-${Date.now()}.pdf`;
  doc.save(fileName);
}


// 立即執行預設報表（demo）
async function runNow(task) {
  // alert(`排程立即執行：${task.name}`);

  try {
    // 根據 task.template 找對應模板（支援 id 或 name）
    const tpl = templates.find((t) => t.id === task.template.toLowerCase());

    if (!tpl) {
      alert(`找不到對應模板：「${task.template}」，請檢查預設報表設定。`);
      return;
    }

    // 切換到指定模板
    selectedTemplate.value = tpl.id;

    // 計算日期區間：to = 今天，from = 今天往前推 N 個月
    const now = new Date();
    const fromDate = new Date(now);  // 先複製一份

    switch (task.rangeType) {
      case "1m":
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;

      case "3m":
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;

      case "6m":
        fromDate.setMonth(fromDate.getMonth() - 6);
        break;

      default:
        // 其他值就什麼都不做，未來再視需求補上預設行為
        break;
    }

    // 套用到頁面上的日期範圍（v-model 綁到 HeaderAndControls）
    from.value = fmtDate(fromDate);
    to.value = fmtDate(now);

    // 產生報表（ReportPreview + 最近匯出都會更新）
    await generateReport();

  } catch (e) {
    console.error("[Reports] runNow error:", e);
    alert("預設報表執行失敗，請稍後再試。");
  }
}

/* 檔案上傳 demo */
function onUpload(e) {
  const f = e.target.files?.[0];
  if (!f) return;
  alert(`已上傳檔案：${f.name}（此為 demo，不會進行解析）`);
}

/* 編輯模板 demo */
function openTemplateEditor() {
  alert("開啟模板編輯器（demo）");
}
</script>

<style scoped></style>
