<template>
  <div
    class="flex min-h-screen flex-col bg-background text-foreground transition-colors duration-500"
  >
    <HeaderBar
      @toggle-sidebar="toggleMobileSidebar"
      @open-login="requestLogin"
    ></HeaderBar>

    <!-- 主要顯示區域 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar -->
      <Sidebar
        :mobile-open="isMobileSidebarOpen"
        @close-mobile="closeMobileSidebar"
        @open-login="requestLogin"
      ></Sidebar>

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

import HeaderBar from "@/components/common/layouts/HeaderBar.vue";
import Sidebar from "@/components/common/layouts/Sidebar.vue";
import Footer from "@/components/common/Footer.vue";

const emit = defineEmits<{
  (event: "open-login"): void;
}>();

const uiStateStore = useUIStateStore();

const isMobileSidebarOpen = ref(false);

function toggleMobileSidebar(): void {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
}

function closeMobileSidebar(): void {
  isMobileSidebarOpen.value = false;
}

function requestLogin(): void {
  closeMobileSidebar();
  emit("open-login");
}

// 切換主要頁面時，自動關閉手機版側邊欄
watch(
  () => uiStateStore.activeTab,
  () => {
    closeMobileSidebar();
  },
);
</script>

<style scoped></style>
