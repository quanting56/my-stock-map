<template>
  <div class="card-theme rounded-2xl shadow p-6">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium">📊 滾動報酬率比較</h3>

      <!-- 右上角：顯示選項快速切換（純 UI 狀態） -->
      <div class="flex gap-2 text-xs text-[color:var(--color-secondary)]">
        <template v-for="option in isLogOptions" :key="option.value">
          <button
            class="px-2 py-1 rounded border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)] transition cursor-pointer"
            :class="useLog === option.value ? 'bg-[color:var(--color-card)] font-semibold' : ''"
            @click="useLog = option.value"
          >
            ⎇ {{ option.label }}
          </button>
        </template>
      </div>
    </div>

    <!-- 主體：左側控制 + 右側圖區 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <!-- 左：控制面板 -->
      <aside class="lg:col-span-4 space-y-4">
        <!-- 指數清單（可多選，純 UI） -->
        <div>
          <h4 class="text-sm font-medium mb-2">選擇要比較的 個股 或 ETF</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="0050.TW" />
              元大台灣50（0050.TW）
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="0056.TW" />
              元大高股息（0056.TW）
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="00878.TW" />
              國泰永續高股息（00878.TW）
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="2330.TW" />
              台積電（2330.TW）
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="2412.TW" />
              中華電（2412.TW）
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" v-model="selected" value="2881.TW" />
              富邦金（2881.TW）
            </label>
          </div>
        </div>

        <!-- 自訂代號（純 UI） -->
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="text-sm text-[color:var(--color-secondary)] block mb-1">自訂代號</label>
            <input
              v-model="customSymbol"
              type="text"
              placeholder="例如：^DJI 或 0050.TW"
              class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none"
            />
          </div>
          <div class="flex items-end">
            <button
              class="w-full px-3 py-2 rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-card)]"
              @click="addCustomSymbol"
            >
              ➕ 加入
            </button>
          </div>
        </div>

        <!-- 圖層/順序（純 UI Demo：可日後做拖拉排序） -->
        <div>
          <h4 class="text-sm font-medium mb-2">圖層與可見度</h4>
          <div class="space-y-2">
            <div
              v-for="s in selected"
              :key="s"
              class="flex items-center justify-between px-3 py-2 rounded-lg border border-[color:var(--color-border)]"
            >
              <div class="flex items-center gap-2">
                <span
                  class="inline-block w-3 h-3 rounded-full"
                  :style="{ background: colorFor(s) }"
                ></span>
                <span class="text-sm">{{ s }}</span>
              </div>
              <div class="flex gap-2 text-xs text-[color:var(--color-secondary)]">
                <button class="text-xs text-[color:var(--color-secondary)] hover:underline">正常</button>
                <button class="text-xs text-[color:var(--color-secondary)] hover:underline">透明</button>
                <button class="text-xs text-[color:var(--color-secondary)] hover:underline">隱藏</button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右：圖表區（目前只放占位） -->
      <section class="lg:col-span-8">
        <div
          class="h-full min-h-72 rounded-lg border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-card)] flex items-center justify-center text-[color:var(--color-secondary)] opacity-70"
        >
          [Index Chart Demo：此處未繪圖，僅為 D3 區域占位]
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import * as d3 from "d3";

const selected = ref(["0050.TW", "2330.TW"]);   // 預設先選兩條，方便展示
const customSymbol = ref("");

const useLog = ref(false);
const isLogOptions = [
  { label: "一般刻度", value: false },
  { label: "對數刻度", value: true },
];

// Demo：指數給定顏色（實作 D3 後可換成 scaleOrdinal）
function colorFor(key) {
  const palette = d3.schemeCategory10.concat(d3.schemeTableau10);
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

// 加入滾動報酬率圖作比較
function addCustomSymbol() {
  const v = (customSymbol.value || "").trim();
  if (!v) return;
  if (!selected.value.includes(v)) selected.value.push(v);
  customSymbol.value = "";
};
</script>

<style scoped></style>
