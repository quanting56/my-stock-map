<template>
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
    

    <!-- 二樓：報表預覽/匯出＋最近匯出與排程任務 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- 報表預覽/匯出 -->
      <ReportPreview
        :latestGenerated="latestGenerated"
        :downloadCSV="downloadCSV"
        :downloadPDF="downloadPDF"
      ></ReportPreview>


      <!-- 最近匯出與排程任務 -->
      <ExportAndScheduleLists
        :recentExports="recentExports"
        :scheduled="scheduled"
        :downloadCSV="downloadCSV"
        :downloadPDF="downloadPDF"
        :runNow="runNow"
      ></ExportAndScheduleLists>
    </div>

    <!-- 三樓：報表匯入 -->
    <ReportImport
      :onUpload="onUpload"
      :openTemplateEditor="openTemplateEditor"
    ></ReportImport>
  </div>
</template>

<script setup>
import HeaderAndControls from "@/components/Reports/HeaderAndControls.vue";
import SummaryCards from "@/components/Reports/SummaryCards.vue";
import ReportPreview from "@/components/Reports/ReportPreview.vue";
import ExportAndScheduleLists from "@/components/Reports/ExportAndScheduleLists.vue";
import ReportImport from "@/components/Reports/ReportImport.vue";
import { ref, reactive } from "vue";

const isGenerating = ref(false);

/* 報表內容 */
const templates = [
  { id: "summary", name: "Summary（總覽）" },
  { id: "positions", name: "Positions（持倉明細）" },
  { id: "trades", name: "Trades（交易紀錄）" }
];

const from = ref("");
const to = ref("");
const selectedTemplate = ref(templates[0].id);

/* 產生與匯出紀錄 */
const exportCount = ref(0);
const recentExports = ref([
  { name: "Daily Summary 2025-10-10", date: "2025-10-10 09:12" },
  { name: "Monthly Positions 2025-09", date: "2025-09-30 18:01" }
]);

const scheduled = reactive([
  { id: "s1", name: "每日 08:00 匯出總覽", frequency: "Daily", template: "Summary", enabled: true },
  { id: "s2", name: "每月 1 號報表", frequency: "Monthly", template: "Positions", enabled: false }
]);

const lastReport = ref(null);
const lastRunTime = ref("");

/* Latest generated report (mock, with raw numbers) */
const latestGenerated = ref(null);

/* 產生報表的示範函式（會塞入假資料） */
function generateReport() {
  isGenerating.value = true;
  const now = new Date();
  const tpl = templates.find(t => t.id === selectedTemplate.value);

  // demo raw rows（存 raw 數值）
  const rows = Array.from({ length: 20 }).map((_, i) => {
    const mv = Math.round(Math.random()*90000)+10000; // marketValue raw number
    const pnlPct = (Math.random()*6-3)/100;          // -3% ~ +3% → raw 0.x
    return {
      ticker: ["2330.TW", "0050.TW", "00675L"][i % 3] + " " + (i+1),
      marketValue: mv,             // raw number
      pnlPct                       // raw number (0.032 代表 3.2%)
    };
  });

  const r = {
    id: `r-${now.getTime()}`,
    template: tpl.id,
    name: `${tpl.name} ${now.toLocaleString()}`,
    date: now.toLocaleString(),
    range: { from: from.value || null, to: to.value || null },
    rows
  };

  latestGenerated.value = r;
  lastReport.value = { name: r.name, date: r.date };
  recentExports.value.unshift({ name: r.name, date: r.date });
  if (recentExports.value.length > 8) recentExports.value.pop();
  exportCount.value++;
  // 更新 last run time 假值
  lastRunTime.value = `${(Math.random()*0.5+0.05).toFixed(2)}s`;
  isGenerating.value = false;
}

/* 假下載處理（實務請串後端或產生檔案） */
function downloadCSV(report) {
  if (!report) return alert("沒有可匯出的報表");

  // 決定欄位（依模板）
  let headers = [];
  if (report.template === "summary") {
    headers = ["generatedAt","from","to","totalMarketValue","totalPnlPct","positionsCount"];
  } else if (report.template === "positions") {
    headers = ["ticker","marketValue","pnlPct"];
  } else if (report.template === "trades") {
    headers = ["datetime","ticker","side","qty","price","fee","tax","net"];
  } else {
    // fallback：用 rows 的 keys
    headers = [...new Set(report.rows.flatMap(r => Object.keys(r)))];
  }

  const lines = [];
  // meta row（可選）
  lines.push(`# name: ${report.name}`);
  lines.push(`# generatedAt: ${new Date(report.date).toISOString()}`);
  if (report.range) lines.push(`# range: ${report.range.from || ""} ~ ${report.range.to || ""}`);
  // header
  lines.push(headers.join(","));
  // rows
  for (const r of report.rows) {
    lines.push(headers.map(h => r[h] ?? "").join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${report.template || "report"}-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadPDF(report) {
  if (!report) return alert("沒有可匯出的報表");

  // 先保留：之後接 jsPDF/pdfmake 或開「列印視圖」交給使用者存 PDF
  alert(`開始下載 PDF：${report.name}`);
}

/* 立即執行排程（demo） */
function runNow(task) {
  alert(`排程立即執行：${task.name}`);
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
