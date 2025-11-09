<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <h3 class="font-medium mb-3">相關新聞 / 消息</h3>

    <!-- 載入中 -->
    <div v-if="isLoading" class="text-sm text-[color:var(--color-secondary)]">正在載入相關新聞…</div>

    <!-- 無資料 -->
    <div v-else-if="items.length === 0" class="text-sm text-[color:var(--color-secondary)]">目前沒有近期新聞</div>

    <!-- 清單（預設只顯示 3 則） -->
    <ul v-else class="space-y-3 text-sm">
      <li
        v-for="(n, i) in visible"
        :key="n.url || i"
      >
        <a
          :href="n.url"
          target="_blank"
          rel="noopener noreferrer"
          class="block p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] 
                 transition hover:border-[color:var(--color-primary)] hover:shadow-sm
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="font-medium leading-snug">
              <span class="hover:underline">{{ stripTrailingSource(n.title, n.source) }}</span>
            </div>
            <div class="pt-0.5 shrink-0 text-xs text-[color:var(--color-secondary)]">
              {{ formatDate(n.publishedAt) }}
            </div>
          </div>
          <div class="mt-1 text-xs text-[color:var(--color-secondary)]">
            {{ n.source }} / {{ stripTrailingSource(n.summary, n.source) }}...
          </div>
        </a>
      </li>
    </ul>

    <!-- 展開/收合 -->
    <div v-if="hiddenCount > 0" class="mt-3">
      <button
        class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-xs cursor-pointer"
        @click="toggle"
      >
        {{ showAll ? '收合' : `顯示更多（${hiddenCount}）` }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useQueryStockStore } from "@/store/queryStock.js";
import { fetchRelevantNews } from "@/api/stocksApi.js";

const queryStock = useQueryStockStore();
const isLoading = ref(false);
const items = ref([]);  // 統一顯示的資料
const showAll = ref(false);

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(+d)) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


// 去掉尾端重複來源，避免 title/summary 重複顯示 新聞來源
function stripTrailingSource(text, source) {
  const t = text;
  const s = source;
  if (!t || !s) return t;

  // 移除結尾的「- 財訊」「— 財訊」「－ 財訊」「| 財訊」「｜ 財訊」「/ 財訊」「／ 財訊」等
  const esc = s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const re = new RegExp(`\\s*(?:[-－—|｜/／])\\s*${esc}\\s*$`, "i");
  return t.replace(re, "").trim();
};


async function loadNews() {
  isLoading.value = true;
  try {
    const arr = await fetchRelevantNews(queryStock.symbol, { days: 180, limit: 30, lang: "zh" });
    items.value = Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.warn("[RelevantNews] 載入失敗：", e?.message || e);
    items.value = [];
  } finally {
    isLoading.value = false;
    showAll.value = false;
  };
};

const visible = computed(() => showAll.value ? items.value : items.value.slice(0, 3));
const hiddenCount = computed(() => Math.max(items.value.length - 3, 0));
function toggle() { showAll.value = !showAll.value; };

watch(() => queryStock.symbol, loadNews, { immediate: true });
</script>

<style scoped></style>
