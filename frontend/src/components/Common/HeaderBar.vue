<template>
  <!-- Header -->
  <header class="card-theme flex items-center gap-3 px-4 py-3 border-b justify-between md:justify-start">
    <div class="flex items-center">
      <button
        type="button"
        class="md:hidden p-2 rounded-lg hover:bg-[color:var(--color-border)] cursor-pointer"
        @click="emit('toggle-sidebar')"
      >
        <span class="block w-5 h-0.5 bg-[color:var(--color-text)] mb-1"></span>
        <span class="block w-5 h-0.5 bg-[color:var(--color-text)] mb-1"></span>
        <span class="block w-5 h-0.5 bg-[color:var(--color-text)]"></span>
      </button>

      <div
        @click="uiState.setTab(uiState.tabs[0].id)"
        class="hidden md:inline-flex items-center gap-1 text-xl font-bold text-[color:var(--color-primary)] cursor-pointer hover:text-[color:var(--color-line2)] transition"
      >
        <div class="w-9 h-9 pb-0.5">
          <MyStockMapLogo></MyStockMapLogo>
        </div>
        My Stock Map
      </div>
    </div>
    <div class="px-6 md:px-24 lg:px-48 xl:px-60">
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
        <!-- <p class="pl-3.5 text-[10px] text-gray-400 md:hidden">例如：2330、2330.TW、台積電</p> -->
      </div>
      <button
        type="submit"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
      >
        搜尋
      </button>
    </form>
    
    <button
      @click="emit('open-login')"
      class="hidden md:inline-block px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
    >
      登入
    </button>
    <button
      type="button"
      @click="uiTheme.toggleUITheme"
      class="hidden md:inline-block px-3 py-1 text-sm rounded-lg border card-theme hover:bg-[color:var(--color-border)] transition cursor-pointer"
    >
      {{ uiTheme.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
    </button>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useUIStateStore } from "@/store/uiState";
import { useUIThemeStore } from "@/store/theme";
import { useQueryStockStore } from "@/store/queryStock";

import MyStockMapLogo from "@/components/Common/MyStockMapLogo.vue";

const uiState = useUIStateStore();
const uiTheme = useUIThemeStore();
const queryStock = useQueryStockStore();

const searchRef = ref(null);
const searchTerm = ref("");

function onSubmit() {
  const q = searchTerm.value.trim();
  if (!q) return;
  queryStock.setSymbol(q);
};

// 快捷鍵「/」聚焦搜尋框
function onKeydown(e) {
  if (e.key === "/" && !/input|textarea/i.test(e.target?.tagName)) {
    e.preventDefault();
    if (searchRef.value) searchRef.value.focus();
  };
};


const emit = defineEmits(["toggle-sidebar", "open-login"]);

onMounted(() => window.addEventListener("keydown", onKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<style scoped></style>
