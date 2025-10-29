<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <h3 class="font-medium mb-3">持有時間表</h3>
    <div
      ref="containerRef"
      class="h-64 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70"
    >
      [個人持有股數折線圖區域 — use D3.js here]
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const containerRef = ref(null);
</script>

<style scoped></style>
