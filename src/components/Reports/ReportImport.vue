<template>
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

<style scoped></style>
