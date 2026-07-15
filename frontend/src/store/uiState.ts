import { defineStore } from "pinia";
import { ref, computed } from "vue";

// 常用頁 → 先全部使用同步載入，未來再視情況看要不要改回 lazy load
import DashboardPage from "@/pages/Dashboard.vue";
import PortfolioPage from "@/pages/Portfolio.vue";
import StockDetailPage from "@/pages/StockDetail.vue";
import BacktestPage from "@/pages/Backtest.vue";
import ReportsPage from "@/pages/Reports.vue";
import SettingsPage from "@/pages/Settings.vue";


import type { Component } from "vue";

interface UITab {
  id: string;
  icon: string;
  title: string;
  pages: Component;
};


export const useUIStateStore = defineStore("uiState", () => {
  const tabs = [
    {
      id: "dashboard",
      icon: "🏠",
      title: "Dashboard",
      pages: DashboardPage
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
      pages: PortfolioPage
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
      pages: StockDetailPage
    },
    {
      id: "backtest",
      icon: "🔍",
      title: "Backtest",
      pages: BacktestPage
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
      pages: ReportsPage
    },
    {
      id: "settings",
      icon: "⚙️",
      title: "Settings",
      pages: SettingsPage
    }
  ] as const satisfies readonly [UITab, ...UITab[]];

  type TabId = typeof tabs[number]["id"];

  // 處理 tab 切換
  const activeTab = ref<TabId>(tabs[0].id);

  const currentTab = computed<UITab>(() => {
    return tabs.find((t) => t.id === activeTab.value) ?? tabs[0];
  });

  function setTab(tabId: TabId) {
    activeTab.value = tabId;
  };

  return { tabs, activeTab, currentTab, setTab };
});
