<template>
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
