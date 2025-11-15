<template>
  <div class="p-6">
    <!-- 頁面標題 + Controls -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10 sm:mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">
          📊 報表管理
        </h1>
        <p class="text-sm text-[color:var(--color-secondary)] mt-1">
          建立、排程與匯出投資/績效相關的報表。
        </p>
      </div>

      <div class="flex flex-col justify-end sm:flex-row gap-3">
        <div class="grid gap-3 justify-items-end">
          <div class="flex items-center gap-2">
            <label class="text-xs text-[color:var(--color-secondary)]">
              日期區間
            </label>
            <input
              type="date"
              v-model="from"
              class="px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]"
            />
            <span class="mx-1 text-sm text-[color:var(--color-secondary)]">—</span>
            <input
              type="date"
              v-model="to"
              class="px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]"
            />
          </div>
  
          <select v-model="selectedTemplate" class="px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]">
            <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>

        <button
          @click="generateReport"
          class="px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition cursor-pointer"
        >
          產生報表
        </button>
      </div>
    </div>

    <!-- 上方小 summary card row（快速 KPI）-->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">上次產生</h3>
        <p class="text-lg font-bold mt-2 text-[color:var(--color-primary)]">{{ lastReport?.name ?? "尚未產生" }}</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">累計匯出次數</h3>
        <p class="text-lg font-bold mt-2 text-[color:var(--color-line2)]">{{ exportCount }}</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">預排任務</h3>
        <p class="text-lg font-bold mt-2 text-[color:var(--color-line3)]">{{ scheduled.length }}</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">最後運行耗時</h3>
        <p class="text-lg font-bold mt-2 text-[color:var(--color-primary)]">{{ lastRunTime }}</p>
      </div>
    </div>

    <!-- 主要內容區：左—報表預覽/匯出、右—最近匯出與排程 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左or上：報表產生 / 預覽卡（大）-->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-medium text-[color:var(--color-primary)]">報表預覽</h3>
          <div class="flex items-center gap-2">
            <button
              @click="downloadCSV(latestGenerated)"
              :disabled="!latestGenerated"
              class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm hover:bg-[color:var(--color-border)] transition disabled:opacity-50 cursor-pointer"
            >
              匯出 CSV
            </button>
            <button
              @click="downloadPDF(latestGenerated)"
              :disabled="!latestGenerated"
              class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm hover:brightness-95 transition disabled:opacity-50 cursor-pointer"
            >
              匯出 PDF
            </button>
          </div>
        </div>

        <div class="border border-[color:var(--color-border)] rounded-lg p-4 min-h-[220px]">
          <template v-if="latestGenerated">
            <div class="mb-4">
              <div class="text-sm text-[color:var(--color-secondary)]">報表名稱</div>
              <div class="font-medium text-[color:var(--color-primary)]">{{ latestGenerated.name }}</div>
              <div class="text-xs text-[color:var(--color-secondary)] mt-1">產生時間：{{ latestGenerated.date }}</div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="p-3 bg-[color:var(--color-card)]">
                <div class="text-xs text-[color:var(--color-secondary)]">總市值（區間）</div>
                <div class="text-lg font-bold text-[color:var(--color-primary)]">
                  {{ fmtCurrency(latestGenerated.rows.reduce((s,r)=>s+(r.marketValue||0),0)) }}
                </div>
              </div>
              <div class="p-3 bg-[color:var(--color-card)]">
                <div class="text-xs text-[color:var(--color-secondary)]">總損益</div>
                <div class="text-lg font-bold text-[color:var(--color-line2)]">
                  {{ fmtPct(
                       latestGenerated.rows.length
                         ? latestGenerated.rows.reduce((s,r)=>s+(r.pnlPct||0),0)/latestGenerated.rows.length
                         : 0
                     ) }}
                </div>
              </div>
            </div>

            <div class="mt-4">
              <h4 class="text-sm font-medium text-[color:var(--color-secondary)] mb-2">樣本資料（摘錄）</h4>
              <div class="overflow-auto max-h-40 border border-[color:var(--color-border)] rounded-md">
                <table class="w-full text-sm">
                  <thead class="bg-[color:var(--color-card)] sticky top-0">
                    <tr>
                      <th class="text-left px-2 py-1 text-[color:var(--color-secondary)]">股票代號</th>
                      <th class="text-right px-2 py-1 text-[color:var(--color-secondary)]">市值</th>
                      <th class="text-right px-2 py-1 text-[color:var(--color-secondary)]">損益%</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in latestGenerated.rows.slice(0,6)"
                      :key="row.ticker"
                      class="odd:bg-transparent even:bg-[color:var(--color-border)]/60"
                    >
                      <td class="px-2 py-2">{{ row.ticker }}</td>
                      <td class="px-2 py-2 text-right">{{ fmtCurrency(row.marketValue) }}</td>
                      <td class="px-2 py-2 text-right">{{ fmtPct(row.pnl) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>

          <template v-else>
            <div class="h-full flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
              尚未產生報表 — 按上方「產生報表」開始。
            </div>
          </template>
        </div>
      </div>

      <!-- 右or下：最近匯出 / 排程 -->
      <div class="card-theme rounded-2xl shadow p-4 space-y-4">
        <div>
          <h3 class="font-medium mb-2 text-[color:var(--color-primary)]">最近匯出</h3>
          <ul class="space-y-2">
            <li
              v-for="(r, i) in recentExports"
              :key="i"
              class="flex items-center justify-between p-2 rounded-md hover:bg-[color:var(--color-border)] transition"
            >
              <div>
                <div class="text-sm font-medium">{{ r.name }}</div>
                <div class="text-xs text-[color:var(--color-secondary)]">{{ r.date }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="downloadCSV(r)" class="px-2 py-1 text-xs rounded border border-[color:var(--color-border)] bg-[color:var(--color-card)] cursor-pointer">CSV</button>
                <button @click="downloadPDF(r)" class="px-2 py-1 text-xs rounded bg-[color:var(--color-primary)] text-white cursor-pointer">PDF</button>
              </div>
            </li>
            <li v-if="recentExports.length === 0" class="text-sm text-[color:var(--color-secondary)]">目前沒有匯出紀錄</li>
          </ul>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-4">
          <h3 class="font-medium mb-2 text-[color:var(--color-primary)]">排程任務</h3>
          <ul class="space-y-2">
            <li v-if="scheduled.length === 0" class="text-sm text-[color:var(--color-secondary)]">尚未建立排程</li>
            <li
              v-else
              v-for="task in scheduled"
              :key="task.id"
              class="flex items-center justify-between p-2 rounded-md hover:bg-[color:var(--color-border)] transition"
            >
              <div>
                <div class="font-medium">{{ task.name }}</div>
                <div class="text-xs text-[color:var(--color-secondary)]">頻率：{{ task.frequency }} • 模板：{{ task.template }}</div>
              </div>
              <div class="flex items-center gap-2">
                <button @click="runNow(task)" class="px-2 py-1 text-xs rounded border border-[color:var(--color-border)] bg-[color:var(--color-card)] cursor-pointer">立即執行</button>
                <label class="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    v-model="task.enabled"
                    class="rounded"
                  />
                  <span class="text-xs text-[color:var(--color-secondary)]">{{ task.enabled ? "啟用" : "停用" }}</span>
                </label>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 下方：匯入/模板區 -->
    <div class="card-theme rounded-2xl shadow p-4 mt-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between">
        <h3 class="font-medium text-[color:var(--color-primary)] mb-4">報表匯入</h3>
        <div class="flex items-center gap-2 mb-4">
          <input type="file" @change="onUpload" class="text-sm border border-gray-200"/>
          <button @click="openTemplateEditor" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm cursor-pointer">匯入</button>
        </div>
      </div>

      <div class="my-2 text-sm text-[color:var(--color-secondary)]">
        匯入外部 CSV 可以快速建立報表來源資料。
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";


// 小工具：格式化（顯示用，資料請存 raw）
const fmtCurrency = (n) => (Number.isFinite(n) ? `$${n.toLocaleString()}` : "—");
const fmtPct = (n) => (Number.isFinite(n) ? `${(n*100).toFixed(2)}%` : "—");

/* 假資料（demo） */
const templates = [
  { id: "summary", name: "Summary（總覽）" },
  { id: "positions", name: "Positions（持倉明細）" },
  { id: "trades", name: "Trades（交易紀錄）" }
];

const from = ref("");
const to = ref("");
const selectedTemplate = ref(templates[0].id);

/* 產生與匯出紀錄 */
const exportCount = ref(12);
const recentExports = ref([
  { name: "Daily Summary 2025-10-10", date: "2025-10-10 09:12" },
  { name: "Monthly Positions 2025-09", date: "2025-09-30 18:01" }
]);

const scheduled = reactive([
  { id: "s1", name: "每日 08:00 匯出總覽", frequency: "Daily", template: "Summary", enabled: true },
  { id: "s2", name: "每月 1 號報表", frequency: "Monthly", template: "Positions", enabled: false }
]);

const lastReport = ref(null);
const lastRunTime = ref("0.18s");

/* Latest generated report (mock, with raw numbers) */
const latestGenerated = ref(null);

/* 產生報表的示範函式（會塞入假資料） */
function generateReport() {
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
