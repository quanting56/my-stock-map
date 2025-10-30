<template>
  <!-- Header -->
  <header class="card-theme flex items-center justify-between px-6 py-3 border-b space-x-4">
    <div class="flex items-center space-x-2">
      <div
        @click="uiState.setTab(uiState.tabs[0].id)"
        class="text-xl font-bold text-[color:var(--color-primary)] cursor-pointer hover:text-[color:var(--color-line2)] transition"
      >
        📊 My Stock Map
      </div>
    </div>
    <div class="md:px-24 lg:px-48 xl:px-60">
      <!-- 預留空間，未來可待作他用 -->
    </div>
    <form
      @submit.prevent="onSubmit"
      class="flex items-center space-x-5 flex-1"
    >
      <div class="flex flex-col flex-1">
        <input
          type="search"
          placeholder="🔍 輸入 / 搜尋股票..."
          ref="searchRef"
          v-model="searchTerm"
          aria-label="搜尋股票代號或名稱"
          class="w-full px-3 py-1 border rounded-full text-sm bg-[color:var(--color-card)] text-theme border-theme focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
        <p class="pl-3.5 text-[10px] text-gray-400 md:hidden">例如：2330、2330.TW、台積電</p>
      </div>
      <button
        type="submit"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
      >
        搜尋
      </button>
    </form>
    
    <button class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer">
      登入
    </button>
    <button
      type="button"
      @click="uiTheme.toggleUITheme"
      class="px-3 py-1 text-sm rounded-lg border card-theme hover:bg-[color:var(--color-border)] transition cursor-pointer"
    >
      {{ uiTheme.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
    </button>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUIStateStore } from "@/store/uiState";
import { useUIThemeStore } from "@/store/theme.js";
import { useQueryStockStore } from "@/store/queryStock.js";

const uiState = useUIStateStore();
const uiTheme = useUIThemeStore();
const queryStock = useQueryStockStore();

const searchRef = ref(null);
const searchTerm = ref("");

function onSubmit() {
  const q = searchTerm.value.trim();
  if (!q) return;
  // queryStock.
  alert(`搜尋 ${q} 的功能建置中`);
};

// 快捷鍵「/」聚焦搜尋框
function onKeydown(e) {
  if (e.key === "/" && !/input|textarea/i.test(e.target?.tagName)) {
    e.preventDefault();
    if (searchRef.value) searchRef.value.focus();
  };
};

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped></style>
