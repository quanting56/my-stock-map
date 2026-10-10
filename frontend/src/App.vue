<template>
  <!-- 全站共用頁面骨架 -->
  <AppLayout @open-login="openLoginModal">
    <Transition
      name="fade"
      mode="out-in"
    >
      <div :key="uiStateStore.activeTab">
        <component :is="uiStateStore.currentTab.pages"></component>
      </div>
    </Transition>
  </AppLayout>

  <!-- 全域 modal -->
  <LogInPage
    :open-modal="isLogInModalOpen"
    @request-close="closeLoginModal"
  ></LogInPage>

  <WelcomeModal
    :open="isWelcomeOpen"
    @close="closeWelcomeModal"
  ></WelcomeModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useUIStateStore } from "@/stores/uiState";

import AppLayout from "@/layouts/AppLayout.vue";
import LogInPage from "@/components/Common/LogInPage.vue";
import WelcomeModal from "@/components/Common/WelcomeModal.vue";

const uiStateStore = useUIStateStore();

const isLogInModalOpen = ref(false);
const isWelcomeOpen = ref(true);

function openLoginModal(): void {
  isLogInModalOpen.value = true;
}

function closeLoginModal(): void {
  isLogInModalOpen.value = false;
}

function closeWelcomeModal(): void {
  isWelcomeOpen.value = false;
}
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
</style>
