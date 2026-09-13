import { ref, watchEffect } from "vue";
import { defineStore } from "pinia";

export const useUIThemeStore = defineStore("uiTheme", () => {
  const isDarkMode = ref<boolean>(false);

  // 監控主題狀態，自動在 <html> 切換 dark class
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
