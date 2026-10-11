<template>
  <!-- Loading 覆蓋層 -->
  <teleport v-if="open" to="body">
    <div
      role="dialog"
      aria-busy="true"
      aria-live="polite"
      class="fixed inset-0 bg-gray-950/50 flex flex-col items-center justify-center z-[999]"
    >
      <div class="h-12 w-12 rounded-full border-4 border-gray-400 border-t-blue-500 animate-spin"></div>
      <p class="mt-4 text-gray-50">{{ message }}，請稍候…</p>
    </div>
  </teleport>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },  // 是否顯示，由父層決定
  message: { type: String, default: "資料讀取中" }  // 顯示訊息
});
</script>

<style scoped></style>
