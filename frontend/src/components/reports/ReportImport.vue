<template>
  <div class="card-theme rounded-2xl shadow p-4 mt-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <h3 class="font-medium text-[color:var(--color-primary)]">報表匯入</h3>
      <div class="flex items-center gap-2">
        <input type="file" @change="onUpload" class="text-sm border border-gray-200"/>
        <button @click="openTemplateEditor" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm cursor-pointer">匯入</button>
      </div>
    </div>

    <div class="my-2 text-sm text-[color:var(--color-secondary)]">
      <p>可透過匯入外部 JSON 或 CSV 來快速建立報表來源資料。</p>
      <ul class="mt-4 p-2 list-disc flex flex-col gap-1 border border-[color:var(--color-border)] rounded-md">
        / 註 /
        <li class="ml-4">匯入的 <span class=" underline">JSON</span> 檔，<code>key</code> 預期會有 <code>"id"</code> 、 <code>"template"</code> 、 <code>"name"</code> 、 <code>"generatedAt"</code> 、 <code>"range"</code> 、 <code>"totalMarketValue"</code> 、 <code>"totalPnlPct"</code> 、 <code>"columns"</code> 、 <code>"rows"</code> 等。</li>
        <li class="ml-4">匯入的 <span class=" underline">CSV</span> 檔，<code>header</code> 預期會有 <code>股票名稱</code> 、 <code>股票代號</code> 、 <code>持股</code> 、 <code>成本</code> 、 <code>現價</code> 、 <code>市值</code> 、 <code>損益%</code> 等欄位。</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  onUpload: {                 // 檔案上傳 handler
    type: Function,
    required: true
  },
  openTemplateEditor: {       // 「開啟模板編輯器」handler
    type: Function,
    required: true
  }
});
</script>

<style scoped>
@reference "tailwindcss";

code {
  @apply bg-[#f4f4f4] px-0.5 py-0.5 whitespace-nowrap rounded-md text-red-700 font-mono border border-gray-200 text-xs;
}
</style>
