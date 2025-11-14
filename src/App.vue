<template>
  <div
    :data-theme="uiThemeStore.isDarkMode ? 'dark' : 'light'"
    class="min-h-screen bg-theme text-theme flex flex-col transition-colors duration-500"
  >
    <HeaderBar></HeaderBar>
    

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
          <div :key="uiStateStore.activeTab">
            <component
              :is="uiStateStore.currentTab.pages"
            ></component>
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
import { useUIThemeStore } from "@/store/theme";
import { useUIStateStore } from "@/store/uiState";

const uiThemeStore = useUIThemeStore();
const uiStateStore = useUIStateStore();
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
</style>
