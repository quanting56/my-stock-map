import { ref, watchEffect } from "vue";
import { defineStore } from "pinia";

export const useUIThemeStore = defineStore("uiTheme", () => {
  const isDarkMode = ref<boolean>(false);

  // 以 <html class="dark"> 作為全站唯一的深色模式狀態來源
  watchEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode.value);
  });

  function toggleUITheme(): void {
    isDarkMode.value = !isDarkMode.value;
  }

  return {
    isDarkMode,
    toggleUITheme,
  };
});
