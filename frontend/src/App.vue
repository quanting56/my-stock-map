<template>
  <div
    class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500"
  >
    <!-- 登入 modal -->
    <LogInPage
      :open-modal="isLogInModalOpen"
      @request-close="closeLoginModal"
    ></LogInPage>

    <WelcomeModal
      :open="isWelcomeOpen"
      @close="closeWelcomeModal"
    ></WelcomeModal>

    <HeaderBar
      @toggle-sidebar="toggleSidebar"
      @open-login="openLoginModal"
    ></HeaderBar>

    <!-- 手機版側邊欄抽屜 -->
    <transition name="slide">
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
              @click="openLoginModal"
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
    </transition>

    <!-- 主要顯示區域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="hidden w-60 space-y-2 border-r border-border bg-surface p-4 md:block">
        <SideBarMenu></SideBarMenu>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <transition
          name="fade"
          mode="out-in"
        >
          <component
            :is="uiStateStore.currentTab.pages"
            :key="uiStateStore.activeTab"
          ></component>
        </transition>
      </main>
    </div>

    <Footer></Footer>
  </div>
</template>

<script setup lang="ts">
import { watch, ref } from "vue";

import { useUIThemeStore } from "@/stores/theme";
import { useUIStateStore } from "@/stores/uiState";

import HeaderBar from "@/components/Common/HeaderBar.vue";
import SideBarMenu from "@/components/Common/SideBarMenu.vue";
import Footer from "@/components/Common/Footer.vue";
import WelcomeModal from "@/components/Common/WelcomeModal.vue";
import MyStockMapLogo from "@/components/Common/MyStockMapLogo.vue";
import LogInPage from "@/components/Common/LogInPage.vue";

const uiThemeStore = useUIThemeStore();
const uiStateStore = useUIStateStore();

const isSidebarOpen = ref(false);
const isLogInModalOpen = ref(false);
const isWelcomeOpen = ref(true);

function toggleSidebar(): void {
  isSidebarOpen.value = !isSidebarOpen.value;
}

function closeSidebar(): void {
  isSidebarOpen.value = false;
}

function openLoginModal(): void {
  isLogInModalOpen.value = true;
}

function closeLoginModal(): void {
  isLogInModalOpen.value = false;
}

function closeWelcomeModal(): void {
  isWelcomeOpen.value = false;
}

// 當切換 Tab 時，自動把手機抽屜關掉
watch(
  () => uiStateStore.activeTab,
  () => {
    closeSidebar();
  },
);
</script>

<style scoped>
@reference "tailwindcss";

/* 頁面切換的淡入淡出動畫 */
.fade-enter-active,
.fade-leave-active {
  @apply transition-opacity duration-200 ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  @apply opacity-0;
}

/* 手機側欄滑入動畫 */
.slide-enter-active,
.slide-leave-active {
  @apply transition-transform duration-200 ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  @apply -translate-x-full;
}
</style>
