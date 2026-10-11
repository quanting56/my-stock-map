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
            <MyStockMapLogo></MyStockMapLogo>
          </div>

          <span class="text-lg font-bold text-brand">My Stock Map</span>
        </div>

        <hr class="mb-4 border-border" />

        <SidebarItems></SidebarItems>

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

  <!-- 寬版 Sidebar -->
  <aside class="hidden w-60 shrink-0 space-y-2 border-r border-border bg-surface p-4 md:block">
    <SidebarItems></SidebarItems>
  </aside>
</template>

<script setup lang="ts">
import { useUIThemeStore } from "@/stores/theme";

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
