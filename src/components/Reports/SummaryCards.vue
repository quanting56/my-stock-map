<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div
      v-for="item in items"
      :key="item.title"
      class="card-theme rounded-2xl shadow p-4 text-center"
    >
      <h3 class="text-sm text-[color:var(--color-secondary)]">{{ item.title }}</h3>
      <p
        :class="item.contentClass"
        class="text-lg font-bold mt-2"
      >
        {{ item.content }}
      </p>
      <p class="text-xs text-[color:var(--color-secondary)] mt-1">{{ item.note }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  lastReport: {     // 由父元件傳入的最後一次報表：{ name?: string, date?: string } | null
    type: Object,
    default: null
  },
  exportCount: {    // 累計匯出次數
    type: Number,
    default: 0
  },
  scheduled: {      // 排程，本 SFC 用其長度顯示數量
    type: Array,
    default: () => []
  },
  lastRunTime: {    // 最後運行耗時字串，例如 "0.18s"
    type: Number,
    default: ""
  }
});

const items = computed(() => [
  {
    title: "上次產生",
    contentClass: "text-[color:var(--color-primary)]",
    content: props.lastReport?.name ?? "尚未產生",
    note: props.lastReport?.date instanceof Date
            ? props.lastReport.date.toLocaleString()
            : "-"
  },
  {
    title: "累計產生次數",
    contentClass: "text-[color:var(--color-line2)]",
    content: props.exportCount ?? 0,
    note: null },
  {
    title: "預排任務",
    contentClass: "text-[color:var(--color-line3)]",
    content: props.scheduled.length,
    note: null
  },
  {
    title: "最後運行耗時",
    contentClass: "text-[color:var(--color-primary)]",
    content: Number.isFinite(props.lastRunTime) ? props.lastRunTime.toFixed(2) + " s" : "-",
    note: null
  }
]);
</script>

<style scoped></style>
