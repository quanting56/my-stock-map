<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <h3 class="font-medium mb-3">相關新聞 / 消息</h3>
    <ul class="space-y-3 text-sm">
      <li v-for="(n, i) in props.notes" :key="i" class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
        <div class="text-xs text-[color:var(--color-secondary)]">{{ n.date }}</div>
        <div class="mt-1">{{ n.text }}</div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  notes: Object
});
</script>

<style scoped></style>
