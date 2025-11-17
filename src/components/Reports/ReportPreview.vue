<template>
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
              {{ displayFormat.fmtCurrency(latestGenerated.rows.reduce((s,r)=>s+(r.marketValue||0),0)) }}
            </div>
          </div>
          <div class="p-3 bg-[color:var(--color-card)]">
            <div class="text-xs text-[color:var(--color-secondary)]">總損益</div>
            <div class="text-lg font-bold text-[color:var(--color-line2)]">
              {{ displayFormat.fmtPct(
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
                  <td class="px-2 py-2 text-right">{{ displayFormat.fmtCurrency(row.marketValue) }}</td>
                  <td class="px-2 py-2 text-right">{{ displayFormat.fmtPct(row.pnlPct) }}</td>
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
</template>

<script setup>
import { useDisplayFormatStore } from '@/store/displayFormat.js';

const props = defineProps({
  latestGenerated: {
    type: Object,
    default: null
  },
  downloadCSV: {
    type: Function,
    required: true
  },
  downloadPDF: {
    type: Function,
    required: true
  }
});

// 小工具：格式化（顯示用，資料請存 raw）
const displayFormat = useDisplayFormatStore();
</script>

<style scoped></style>
