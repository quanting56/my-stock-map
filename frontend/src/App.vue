<template>
  <div
    :data-theme="uiThemeStore.isDarkMode ? 'dark' : 'light'"
    class="bg-theme text-theme flex min-h-screen flex-col transition-colors duration-500"
  >
    <!-- 登入 modal -->
    <LogInPage
      :open-modal="isLogInPageOpen"
      @request-close="isLogInPageOpen = false"
    ></LogInPage>

    <WelcomeModal
      :open="isWelcomeOpen"
      @close="isWelcomeOpen = false"
    />

    <HeaderBar
      @toggle-sidebar="isSidebarOpen = !isSidebarOpen"
      @open-login="isLogInPageOpen = true"
    ></HeaderBar>

    <!-- 手機版側邊欄抽屜 -->
    <transition name="slide">
      <div
        v-if="isSidebarOpen"
        class="fixed inset-0 z-40 md:hidden"
        @click.self="isSidebarOpen = false"
      >
        <!-- 抽屜本體 -->
        <aside
          class="card-theme relative z-50 h-full w-64 max-w-[80vw] space-y-2 overflow-y-auto border-r p-4"
        >
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="h-9 w-9 pb-0.5">
              <MyStockMapLogo />
            </div>

            <span class="text-lg font-bold text-primary">My Stock Map</span>
          </div>

          <hr class="mb-4 border-border" />

          <SideBarMenu></SideBarMenu>

          <!-- 登入按鈕 + 日間/夜間模式切換 -->
          <div class="mt-8 flex items-center gap-2">
            <button
              type="button"
              class="cursor-pointer rounded-lg bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
              @click="isLogInPageOpen = true"
            >
              登入
            </button>

            <button
              type="button"
              class="card-theme cursor-pointer rounded-lg border px-3 py-1 text-sm transition hover:bg-border"
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
      <aside class="card-theme hidden w-60 space-y-2 border-r p-4 md:block">
        <SideBarMenu></SideBarMenu>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <transition
          name="fade"
          mode="out-in"
        >
          <!-- 用 activeTab 當 Suspense 的 key，切 tab 時重新進入 pending/fallback 流程 -->
          <div :key="uiStateStore.activeTab">
            <Suspense>
              <!-- 已載入完成的狀態 -->
              <template #default>
                <component :is="uiStateStore.currentTab.pages"></component>
              </template>

              <!-- 載入中狀態 -->
              <template #fallback>
                <LoadingModal
                  :open="true"
                  message="畫面載入中，請稍候"
                ></LoadingModal>
              </template>
            </Suspense>
          </div>
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
import LoadingModal from "@/components/Common/LoadingModal.vue";
import WelcomeModal from "@/components/Common/WelcomeModal.vue";
import MyStockMapLogo from "@/components/Common/MyStockMapLogo.vue";
import LogInPage from "@/components/Common/LogInPage.vue";

const uiThemeStore = useUIThemeStore();
const uiStateStore = useUIStateStore();

const isSidebarOpen = ref(false);
const isLogInPageOpen = ref(false);
const isWelcomeOpen = ref(true);

// 當切換 Tab 時，自動把手機抽屜關掉
watch(
  () => uiStateStore.activeTab,
  () => {
    isSidebarOpen.value = false;
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
