<template>
  <!-- Header -->
  <header
    class="sticky top-0 z-30 flex h-(--app-header-height) shrink-0 items-center gap-3 border-b border-border bg-surface px-4 text-foreground"
  >
    <div class="flex items-center">
      <button
        type="button"
        aria-label="開啟側邊欄"
        class="cursor-pointer rounded-lg border border-transparent p-2 transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:border-action md:hidden"
        @click="emit('toggle-sidebar')"
      >
        <span class="mb-1 block h-0.5 w-5 bg-foreground"></span>
        <span class="mb-1 block h-0.5 w-5 bg-foreground"></span>
        <span class="block h-0.5 w-5 bg-foreground"></span>
      </button>

      <button
        type="button"
        aria-label="回到 Dashboard"
        class="hidden cursor-pointer items-center gap-1 rounded-lg text-xl font-bold text-brand transition-[color,transform] hover:text-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:scale-99 md:inline-flex"
        @click="goToDashboard"
      >
        <span class="h-9 w-9 pb-0.5">
          <MyStockMapLogo></MyStockMapLogo>
        </span>

        <span>My Stock Map</span>
      </button>
    </div>

    <form
      class="flex flex-1 items-center space-x-5"
      @submit.prevent="onSubmit"
    >
      <div class="ml-12 flex flex-1 flex-col md:ml-48 lg:ml-96 xl:ml-120">
        <input
          ref="searchRef"
          v-model="searchTerm"
          type="search"
          placeholder="🔍 輸入 / 搜尋股票..."
          aria-label="搜尋股票代號或名稱"
          class="w-full rounded-full border border-border bg-surface px-3 py-1 text-sm text-foreground transition-colors placeholder:text-foreground-subtle hover:border-border-strong focus:border-focus focus:outline-2 focus:outline-offset-2 focus:outline-focus"
        />
        <!-- <p class="pl-3.5 text-[10px] text-gray-400 md:hidden">例如：2330、2330.TW、台積電</p> -->
      </div>

      <button
        type="submit"
        class="cursor-pointer rounded-lg border border-transparent bg-action px-3 py-1 text-sm text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:outline-2 active:outline-offset-2 active:outline-action"
      >
        搜尋
      </button>
    </form>

    <button
      type="button"
      class="hidden cursor-pointer rounded-lg border border-transparent bg-action px-3 py-1 text-sm text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:outline-2 active:outline-offset-2 active:outline-action md:inline-block"
      @click="emit('open-login')"
    >
      登入
    </button>

    <button
      type="button"
      class="hidden cursor-pointer rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:border-action md:inline-block"
      @click="uiThemeStore.toggleUITheme"
    >
      {{ uiThemeStore.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
    </button>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";

import { useQueryStockStore } from "@/stores/queryStock";
import { useUIStateStore } from "@/stores/uiState";
import { useUIThemeStore } from "@/stores/theme";

import MyStockMapLogo from "@/components/common/MyStockMapLogo.vue";

const emit = defineEmits<{
  (event: "toggle-sidebar"): void;
  (event: "open-login"): void;
}>();

const uiStateStore = useUIStateStore();
const uiThemeStore = useUIThemeStore();
const queryStockStore = useQueryStockStore();

const searchRef = ref<HTMLInputElement | null>(null);
const searchTerm = ref("");

function goToDashboard(): void {
  uiStateStore.setTab("dashboard");
}

function onSubmit(): void {
  const query = searchTerm.value.trim();

  if (!query) {
    return;
  }

  queryStockStore.setSymbol(query);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target instanceof HTMLSelectElement
    || target.isContentEditable
  );
}

/** 快捷鍵「/」聚焦搜尋框。 */
function onKeydown(event: KeyboardEvent): void {
  if (
    event.key !== "/"
    || event.ctrlKey
    || event.metaKey
    || event.altKey
    || isEditableTarget(event.target)
  ) {
    return;
  }

  event.preventDefault();
  searchRef.value?.focus();
}

onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped></style>
