<template>
  <div
    :data-theme="uiThemeStore.isDarkMode ? 'dark' : 'light'"
    class="min-h-screen bg-theme text-theme flex flex-col transition-colors duration-500"
  >
    <!-- 登入頁 -->
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
          class="relative z-50 w-64 max-w-[80vw] h-full card-theme border-r p-4 space-y-2 overflow-y-auto"
        >
          <!-- Logo -->
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 pb-0.5">
              <MyStockMapLogo />
            </div>
            <span class="text-lg font-bold text-[color:var(--color-primary)]">
              My Stock Map
            </span>
          </div>

          <hr class="mb-4 border-[color:var(--color-border)]" />
  
          <SideBarMenu></SideBarMenu>
  
          <!-- 登入按鈕 + 日間/夜間模式切換 -->
          <div class="flex items-center gap-2 mt-8">
            <button
              type="button"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer"
              @click="isLogInPageOpen = true"
            >
              登入
            </button>
            <button
              type="button"
              class="px-3 py-1 text-sm rounded-lg border card-theme hover:bg-[color:var(--color-border)] transition cursor-pointer"
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
      <aside class="w-60 card-theme border-r p-4 space-y-2 hidden md:block">
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
                <component
                  :is="uiStateStore.currentTab.pages"
                ></component>
              </template>
  
              <!-- 載入中狀態 -->
              <template #fallback>
                <LoadingModal :open="true" message="畫面載入中，Demo版本初次載入較久"></LoadingModal>
              </template>
            </Suspense>
          </div>
        </transition>
      </main>
    </div>

    <Footer></Footer>
  </div>
</template>

<script setup>
import HeaderBar from "@/components/Common/HeaderBar.vue";
import SideBarMenu from "@/components/Common/SideBarMenu.vue";
import Footer from "@/components/Common/Footer.vue";

import LoadingModal from "@/components/Common/LoadingModal.vue";
import WelcomeModal from "@/components/Common/WelcomeModal.vue";
import MyStockMapLogo from "@/components/Common/MyStockMapLogo.vue";
import LogInPage from "@/components/Common/LogInPage.vue";

import { watch, ref } from "vue";
import { useUIThemeStore } from "@/stores/theme";
import { useUIStateStore } from "@/stores/uiState";

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
  }
);
</script>

<style scoped>
@reference "tailwindcss";

/* 右側Tabs切換時 */
/* 淡入淡出動畫：fade */
.fade-enter-active, .fade-leave-active {
  @apply transition-opacity duration-200 ease-in-out;
}
.fade-enter-from, .fade-leave-to {
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
