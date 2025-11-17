<template>
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10 sm:mb-6">
    <div>
      <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">
        📊 報表管理
      </h1>
      <p class="text-sm text-[color:var(--color-secondary)] mt-1">
        建立、排程與匯出投資/績效相關的報表。
      </p>
    </div>

    <div class="flex flex-col justify-end sm:flex-row gap-3">
      <div class="grid gap-3 justify-items-end">
        <div class="flex items-center gap-2">
          <label class="text-xs text-[color:var(--color-secondary)]">
            日期區間
          </label>
          <input
            type="date"
            v-model="fromModel"
            class="px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]"
          />
          <span class="mx-1 text-sm text-[color:var(--color-secondary)]">—</span>
          <input
            type="date"
            v-model="toModel"
            class="px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]"
          />
        </div>

        <select v-model="selectedTemplateModel" class="px-3 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] text-[color:var(--color-text)]">
          <option
            v-for="t in templates"
            :key="t.id"
            :value="t.id"
          >
            {{ t.name }}
          </option>
        </select>
      </div>

      <button
        @click="$emit('generateReport')"
        :disabled="busy"
        class="px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-white
               hover:brightness-95 transition cursor-pointer disabled:opacity-60"
      >
        {{ busy ? "產生中…" : "產生報表" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  from: {
    type: String,
    default: ""
  },
  to: {
    type: String,
    default: ""
  },
  selectedTemplate: {
    type: String,
    default: ""
  },
  templates: {
    type: Array,
    default: () => []
  },
  busy: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits([
  "update:from",
  "update:to",
  "update:selectedTemplate",
  "generateReport"
]);

// 具名 v-model 的 get/set 包裝
const fromModel = computed({
  get: () => props.from,
  set: (v) => emit("update:from", v),
});
const toModel = computed({
  get: () => props.to,
  set: (v) => emit("update:to", v),
});
const selectedTemplateModel = computed({
  get: () => props.selectedTemplate,
  set: (v) => emit("update:selectedTemplate", v),
});
</script>

<style scoped></style>
