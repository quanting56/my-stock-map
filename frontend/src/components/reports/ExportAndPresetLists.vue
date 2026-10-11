<template>
  <div class="card-theme rounded-2xl shadow p-4 space-y-4">
    <!-- 最近匯出 -->
    <div>
      <h3 class="font-medium mb-2 text-[color:var(--color-primary)]">最近匯出</h3>
      <ul class="space-y-2 max-h-64 overflow-y-auto pr-1">
        <li
          v-for="(r, i) in recentExports"
          :key="i"
          class="flex items-center justify-between p-2 rounded-md hover:bg-[color:var(--color-border)] transition"
        >
          <div>
            <div class="text-sm font-medium">{{ r.name }}</div>
            <div class="text-xs text-[color:var(--color-secondary)]">{{ r.date.toLocaleString() }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button @click="downloadCSV(r)" class="px-2 py-1 text-xs rounded border border-[color:var(--color-border)] bg-[color:var(--color-card)] cursor-pointer">CSV</button>
            <button @click="downloadPDF(r)" class="px-2 py-1 text-xs rounded bg-[color:var(--color-primary)] text-white cursor-pointer">PDF</button>
          </div>
        </li>
        <li v-if="recentExports.length === 0" class="text-sm text-[color:var(--color-secondary)]">目前沒有匯出紀錄</li>
      </ul>
    </div>


    <!-- 預設任務 -->
    <div class="border-t border-[color:var(--color-border)] pt-4">
      <h3 class="font-medium mb-2 text-[color:var(--color-primary)]">預設報表</h3>
      <p class="text-xs text-[color:var(--color-secondary)] mb-2">
    點選下方按鈕，會自動套用常用區間（近一個月、近一季度、近半年度）並產生報表。
  </p>
      <ul class="space-y-2 max-h-64 overflow-y-auto pr-1">
        <li v-if="scheduled.length === 0" class="text-sm text-[color:var(--color-secondary)]">尚未建立預設報表</li>
        <li
          v-else
          v-for="task in scheduled"
          :key="task.id"
          class="flex items-center justify-between p-2 rounded-md hover:bg-[color:var(--color-border)] transition"
        >
          <div>
            <div class="font-medium">{{ task.name }} ({{ task.rangeType }})</div>
            <div class="mt-0.5 text-xs text-[color:var(--color-secondary)]">
              - 模板：{{ task.template }}<br />
              - 區間：{{ fmtDate(new Date(task.from)) }} ~ {{ fmtDate(new Date(task.to)) }}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="runNow(task)"
              class="px-4 py-2 text-sm rounded border border-[color:var(--color-border)] hover:border-[color:var(--color-primary)] bg-[color:var(--color-card)] cursor-pointer"
            >
              立即<br />套用
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  recentExports: {       // 最近匯出列表
    type: Array,
    default: () => []
  },
  scheduled: {           // 排程列表
    type: Array,
    default: () => []
  },
  fmtDate: {             // 格式化 UI 日期顯示用
    type: Function,
    required: true
  },
  downloadCSV: {         // 匯出 CSV 函式
    type: Function,
    required: true
  },
  downloadPDF: {         // 匯出 PDF 函式
    type: Function,
    required: true
  },
  runNow: {              // 「立即執行排程」函式
    type: Function,
    required: true
  }
});
</script>

<style scoped></style>
