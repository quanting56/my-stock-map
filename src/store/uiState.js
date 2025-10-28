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
    // {
    //   id: "dashboardOld",
    //   icon: "🏠",
    //   title: "Dashboard (old)",
    //   pages: defineAsyncComponent(() =>
    //     import("@/components/Demo/AppAndDashboardDemo.vue")
    //   )
    // },
    // {
    //   id: "dashboardNew",
    //   icon: "🏠",
    //   title: "Dashboard (new)",
    //   pages: defineAsyncComponent(() =>
    //     import("@/components/Demo/DashboardNewDemo.vue")
    //   )
    // },
    {
      id: "portfolio",
      icon: "💼",
      title: "Portfolio",
      pages: defineAsyncComponent(() =>
        import("@/pages/Portfolio.vue")
      )
    },
    // {
    //   id: "portfolionew",
    //   icon: "💼",
    //   title: "Portfolio (new) ❌",
    //   pages: defineAsyncComponent(() =>
    //     import("@/components/Demo/PortfolioNewDemo.vue")
    //   )
    // },
    // {
    //   id: "stockDetailOld",
    //   icon: "📈",
    //   title: "Stock Detail (old) ❌",
    //   pages: defineAsyncComponent(() =>
    //     import("@/components/Demo/StockDetailOldDemo.vue")
    //   )
    // },
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
    // {
    //   id: "backtestNew",
    //   icon: "🔍",
    //   title: "Backtest (new) ❌",
    //   pages: defineAsyncComponent(() =>
    //     import("@/components/Demo/BacktestNewDemo.vue")
    //   )
    // },
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
  const activeTab = ref(tabs[3].id);

  const currentTab = computed(() => {
    return tabs.find((t) => t.id === activeTab.value) || tabs[0];
  });

  function setTab(tabId) {
    activeTab.value = tabId;
  };

  return { tabs, activeTab, currentTab, setTab };
});
