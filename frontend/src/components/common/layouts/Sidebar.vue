<template>
  <!-- 手機版 Sidebar -->
  <Transition name="slide">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 md:hidden"
      @click.self="emit('close-mobile')"
    >
      <aside
        class="relative z-50 h-full w-64 max-w-[80vw] space-y-2 overflow-y-auto border-r border-border bg-surface p-4"
      >
        <!-- Logo -->
        <div class="flex items-center gap-2">
          <div class="h-9 w-9 pb-0.5">
            <MyStockMapLogo background="transparent"></MyStockMapLogo>
          </div>

          <span class="text-lg font-bold text-brand">My Stock Map</span>
        </div>

        <hr class="mb-4 border-border" />

        <SidebarItems></SidebarItems>

        <!-- 登入按鈕 + 日間/夜間模式切換 -->
        <div class="mt-8 flex items-center gap-2">
          <BaseButton
            type="button"
            variant="primary"
            @click="requestLogin"
          >
            登入
          </BaseButton>

          <BaseButton
            type="button"
            variant="secondary"
            @click="uiThemeStore.toggleUITheme"
          >
            {{ uiThemeStore.isDarkMode ? "🌞 日間模式" : "🌙 夜間模式" }}
          </BaseButton>
        </div>
      </aside>
    </div>
  </Transition>

  <!-- 中尺寸 Sidebar -->
  <div
    class="sticky top-(--app-header-height) z-20 hidden h-[calc(100dvh-var(--app-header-height))] shrink-0 self-start transition-[width] duration-200 ease-in-out md:block xl:hidden"
    :class="isMediumSidebarExpanded ? 'w-60' : 'w-16'"
  >
    <aside class="h-full overflow-x-hidden overflow-y-auto border-r border-border bg-surface">
      <!-- 內部固定保持完整 Sidebar 寬度，外層負責改變可見寬度，避免 SidebarItems 在收合時重新排版 -->
      <div class="w-60 p-3">
        <SidebarItems :collapsed="!isMediumSidebarExpanded"></SidebarItems>
      </div>
    </aside>

    <!-- 中尺寸 Sidebar 展開 / 收合按鈕 -->
    <button
      type="button"
      :aria-expanded="isMediumSidebarExpanded"
      :aria-label="isMediumSidebarExpanded ? '收合側邊欄' : '展開側邊欄'"
      :title="isMediumSidebarExpanded ? '收合側邊欄' : '展開側邊欄'"
      class="absolute top-1/2 right-0 z-10 flex h-8 w-8 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:border-action"
      @click="toggleMediumSidebar"
    >
      <span
        class="text-lg leading-none"
        aria-hidden="true"
      >
        {{ isMediumSidebarExpanded ? "‹" : "›" }}
      </span>
    </button>
  </div>

  <!-- 寬版 Sidebar -->
  <aside
    class="sticky top-(--app-header-height) z-20 hidden h-[calc(100dvh-var(--app-header-height))] w-60 shrink-0 space-y-2 self-start overflow-y-auto border-r border-border bg-surface p-4 xl:block"
  >
    <SidebarItems></SidebarItems>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue";

import { useUIThemeStore } from "@/stores/theme";

import BaseButton from "@/components/ui/BaseButton.vue";
import MyStockMapLogo from "@/components/common/MyStockMapLogo.vue";
import SidebarItems from "@/components/common/layouts/SidebarItems.vue";

defineProps<{
  mobileOpen: boolean;
}>();

const emit = defineEmits<{
  (event: "close-mobile"): void;
  (event: "open-login"): void;
}>();

const uiThemeStore = useUIThemeStore();

const isMediumSidebarExpanded = ref(false);

function toggleMediumSidebar(): void {
  isMediumSidebarExpanded.value = !isMediumSidebarExpanded.value;
}

function requestLogin(): void {
  emit("open-login");
}
</script>

<style scoped>
@reference "tailwindcss";

.slide-enter-active,
.slide-leave-active {
  @apply transition-transform duration-200 ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  @apply -translate-x-full;
}
</style>
