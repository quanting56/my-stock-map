import { defineStore } from "pinia";
import { ref, watchEffect } from "vue";

export const useUIThemeStore = defineStore("uiTheme", () => {
  const isDarkMode = ref<boolean>(false);

  // 監控變化時自動套用 class 到 <html> 或 <body>
  watchEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode.value);
  });

  function toggleUITheme(): void {
    isDarkMode.value = !isDarkMode.value;
  };

  return { isDarkMode, toggleUITheme };
});
