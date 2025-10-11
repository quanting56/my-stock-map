import { defineStore } from "pinia";
import { ref, computed, defineAsyncComponent } from "vue";

export const useUIStateStore = defineStore("uiState", () => {
  const tabs = [
    {
      id: "dashboard",
      icon: "🏠",
      title: "Dashboard",
      pages: defineAsyncComponent(() =>
        import("@/pages/Dashboard.vue")
      )
    },
    {
      id: "portfolio",
      icon: "💼",
      title: "Portfolio",
      pages: defineAsyncComponent(() =>
        import("@/pages/Portfolio.vue")
      )
    },
    {
      id: "stockDetail",
      icon: "📈",
      title: "Stock Detail",
      pages: defineAsyncComponent(() =>
        import("@/pages/StockDetail.vue")
      )
    },
    {
      id: "backtest",
      icon: "🔍",
      title: "Backtest",
      pages: defineAsyncComponent(() =>
        import("@/pages/Backtest.vue")
      )
    },
    {
      id: "reports",
      icon: "📊",
      title: "Reports",
      pages: defineAsyncComponent(() =>
        import("@/pages/Reports.vue")
      )
    },
    {
      id: "settings",
      icon: "⚙️",
      title: "Settings",
      pages: defineAsyncComponent(() =>
        import("@/pages/Settings.vue")
      )
    }
  ];

  // 處理 tab 切換
  const activeTab = ref(tabs[0].id);

  const currentTab = computed(() => {
    return tabs.find((t) => t.id === activeTab.value) || tabs[0];
  });

  function setTab(tabId) {
    activeTab.value = tabId;
  };

  return { tabs, activeTab, currentTab, setTab };
});
