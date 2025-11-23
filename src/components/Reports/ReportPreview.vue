<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4 flex flex-col">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-primary)]">報表預覽</h3>
      <div class="flex items-center gap-2">
        <button
          @click="downloadCSV(latestGenerated)"
          :disabled="!latestGenerated"
          class="px-3 py-1 rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-card)] text-sm hover:bg-[color:var(--color-primary)] hover:text-white transition disabled:opacity-50 cursor-pointer"
        >
          匯出 CSV
        </button>
        <button
          @click="downloadJSON(latestGenerated)"
          :disabled="!latestGenerated"
          class="px-3 py-1 rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-card)] text-sm hover:bg-[color:var(--color-primary)] hover:text-white transition disabled:opacity-50 cursor-pointer"
        >
          匯出 JSON
        </button>
        <button
          @click="downloadPDF(latestGenerated)"
          :disabled="!latestGenerated"
          class="px-3 py-1 rounded-md border border-[color:var(--color-primary)] bg-[color:var(--color-card)] text-sm hover:bg-[color:var(--color-primary)] hover:text-white transition disabled:opacity-50 cursor-pointer"
        >
          匯出 PDF
        </button>
      </div>
    </div>
    
    <div class="flex-1 border border-[color:var(--color-border)] rounded-lg p-4 min-h-[220px]">
      <template v-if="latestGenerated">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <div class="text-sm text-[color:var(--color-secondary)]">報表名稱 ——</div>
            <div class="font-medium text-[color:var(--color-primary)] mt-1">{{ latestGenerated.name }}</div>
            <div class="text-xs text-[color:var(--color-secondary)] mt-1">此報表產生時刻：{{ latestGenerated.date.toLocaleString() }}</div>
          </div>
          <div class="text-[11px] text-[color:var(--color-secondary)] text-center">
            區間：{{ latestGenerated.range.from }} ~ {{ latestGenerated.range.to }}
          </div>
        </div>  
        <div class="grid grid-cols-2 gap-4">
          <div class="p-3 bg-[color:var(--color-card)]">
            <div class="text-xs text-[color:var(--color-secondary)]">總市值（區間最末日）</div>
            <div class="text-lg font-bold text-[color:var(--color-primary)]">
              {{ displayFormat.fmtCurrency(latestGenerated.totalMarketValue) }}
            </div>
          </div>
          <div class="p-3 bg-[color:var(--color-card)]">
            <div class="text-xs text-[color:var(--color-secondary)]">總損益（此區間）</div>
            <!-- 下面這個 DOM 還要修改 -->
            <div
              :class="latestGenerated.totalPnlPct > 0 ? 'text-[color:var(--color-line2)]' : 'text-[color:var(--color-line3)]'"
              class="text-lg font-bold text-[color:var(--color-line2)]"
            >
              {{ latestGenerated.totalPnlPct > 0 ? "+" : "" }}{{ displayFormat.fmtPct(latestGenerated.totalPnlPct) }}
            </div>
          </div>
        </div>  
        <div class="mt-4">
          <h4 class="text-sm font-medium text-[color:var(--color-secondary)] mb-2">樣本資料（摘錄）</h4>
          <div class="overflow-auto border border-[color:var(--color-border)] rounded-md">
            <table class="w-full text-sm whitespace-nowrap">
              <thead class="bg-[color:var(--color-card)] sticky top-0">
                <tr>
                  <th
                    v-for="col in props.latestGenerated.columns"
                    :key="col.key"
                    :class="col.align === 'right' ? 'text-right' : 'text-left'"
                    class="text-left px-2 py-1 text-[color:var(--color-secondary)]"
                  >
                    {{ col.label }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, i) in latestGenerated.rows"
                  :key="i"
                  class="odd:bg-transparent even:bg-[color:var(--color-border)]/60"
                >
                  <td
                    v-for="col in latestGenerated.columns"
                    :key="col.key"
                    :class="col.align === 'right' ? 'text-right' : 'text-left'"
                    class="px-2 py-2"
                  >
                    <template v-if="col.format === 'fmtCurrency'">
                      {{ displayFormat.fmtCurrency(row[col.key]) }}
                    </template>
                    <template v-else-if="col.format === 'fmtPct'">
                      <span :class="row[col.key] > 0 ? 'text-[color:var(--color-line2)]' : 'text-[color:var(--color-line3)]'">
                        {{ row[col.key] > 0 ? "+" : "" }}{{ displayFormat.fmtPct(row[col.key]) }}
                      </span>
                    </template>
                    <template v-else-if="col.format === 'threeDigitSeparator'">
                      {{ row[col.key].toLocaleString() }}
                    </template>
                    <template v-else>
                      {{ row[col.key] }}
                    </template>
                  </td>
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
  downloadJSON: {
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
