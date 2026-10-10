<template>
  <div
    class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500"
  >
    <HeaderBar
      @toggle-sidebar="toggleSidebar"
      @open-login="requestLogin"
    ></HeaderBar>

    <!-- 手機版側邊欄抽屜 -->
    <Transition name="slide">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 md:hidden"
        @click.self="closeSidebar"
      >
        <!-- 抽屜本體 -->
        <aside
          class="relative z-50 h-full w-64 max-w-[80vw] space-y-2 overflow-y-auto border-r border-border bg-surface p-4"
        >
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="h-9 w-9 pb-0.5">
              <MyStockMapLogo></MyStockMapLogo>
            </div>

            <span class="text-lg font-bold text-brand">My Stock Map</span>
          </div>

          <hr class="mb-4 border-border" />

          <SideBarMenu></SideBarMenu>

          <!-- 登入按鈕 + 日間/夜間模式切換 -->
          <div class="mt-8 flex items-center gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg border border-transparent bg-action px-3 py-1 text-sm text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:outline-2 active:outline-offset-2 active:outline-action"
              @click="requestLogin"
            >
              登入
            </button>

            <button
              type="button"
              class="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:border-action"
              @click="uiThemeStore.toggleUITheme()"
            >
              {{ uiThemeStore.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
            </button>
          </div>
        </aside>
      </div>
    </Transition>

    <!-- 主要顯示區域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Desktop Sidebar -->
      <aside class="hidden w-60 space-y-2 border-r border-border bg-surface p-4 md:block">
        <SideBarMenu></SideBarMenu>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <slot></slot>
      </main>
    </div>

    <Footer></Footer>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import { useUIStateStore } from "@/stores/uiState";
import { useUIThemeStore } from "@/stores/theme";

import HeaderBar from "@/components/Common/HeaderBar.vue";
import MyStockMapLogo from "@/components/Common/MyStockMapLogo.vue";
import SideBarMenu from "@/components/Common/SideBarMenu.vue";
import Footer from "@/components/Common/Footer.vue";

const emit = defineEmits<{
  (event: "open-login"): void;
}>();

const uiStateStore = useUIStateStore();
const uiThemeStore = useUIThemeStore();

const isSidebarOpen = ref(false);

function toggleSidebar(): void {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar(): void {
  isSidebarOpen.value = false;
}

function requestLogin(): void {
  closeSidebar();
  emit("open-login");
}

// 切換主要頁面時，自動關閉手機版側邊欄
watch(
  () => uiStateStore.activeTab,
  () => {
    closeSidebar();
  },
);
</script>

<style scoped>
@reference "tailwindcss";

/* 手機側邊欄滑入 / 滑出動畫 */
.slide-enter-active,
.slide-leave-active {
  @apply transition-transform duration-200 ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  @apply -translate-x-full;
}
</style>
