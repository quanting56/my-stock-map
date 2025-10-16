import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

// 設定 localStorage 的 key 名稱，方便存取與維護
const STORAGE_KEY = "myStockMap_holdings";


// 範例預設資料（開發用）
// 若使用者第一次開啟、localStorage 沒有資料，就會使用這組 mock data
const holdingDetailsMockData = [
  {
    id: null,
    name: "現金",
    shares: 1,
    price: 35590,
    cost: 35590,
  },
  {
    id: "2330.TW",  // 股號
    name: "台積電",  // 股票名稱
    shares: 167,  // 持有股數
    price: 1425,  // 現價
    cost: 899,  // 成本
  },
  { id: "00757.TW", name: "統一FANG+", shares: 934, price: 117.9, cost: 100 },
  { id: "00675L.TW", name: "富邦臺灣加權正二", shares: 5796, price: 125.5, cost: 77.83 }
];


export const usePortfolioStore = defineStore("portfolio", () => {
  // 從 localStorage 讀取使用者已儲存的資料（若沒資料，使用 mock data）
  const raw = localStorage.getItem(STORAGE_KEY);
  const holdingDetailsData = ref(raw ? JSON.parse(raw) : holdingDetailsMockData);

  // 確保每個項目都有值（若使用者只存 shares/price）
  function recalcValues() {
    holdingDetailsData.value.forEach(h => {
      h.id = h.id || null;
      h.name = h.name || h.id;
      h.shares = Number(h.shares) || 0;
      h.price = Number(h.price) || 0;
      h.cost = Number(h.cost) || 0;
      h.stockValue = Number((h.shares * h.price) || 0);
    })
  };
  recalcValues();

  // 自動同步到 localStorage（深度監聽）
  watch(holdingDetailsData, (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch (e) {
      console.warn("存 localStorage 失敗", e);  // 若超出容量或權限錯誤，顯示警告
    }
  }, { deep: true });


  // 操作函式們 ---------

  // 新增或更新持股資料（例如使用者輸入新的股票）
  function addOrUpdateHolding(h) {
    // h 應該包含 id, name, shares, price, cost

    // 找尋 id 相同的項目
    const idx = holdingDetailsData.value.findIndex(x => x.id === h.id);

    // 正規化資料：確保所有欄位
    const normalized = {
      id: h.id,
      name: h.name || h.id,
      shares: Number(h.shares) || 0,
      price: Number(h.price) || 0,
      cost: Number(h.cost) || 0
    };
    normalized.value = normalized.shares * normalized.price;

    if (idx === -1) {
      // 若找不到，代表是新增股票
      holdingDetailsData.value.push(normalized);
    } else {
      // 若已有該股票，更新原資料（用展開運算子合併）
      holdingDetailsData.value[idx] = { ...holdingDetailsData.value[idx], ...normalized };
    };
  };

  // 根據 id 刪除持股
  function removeHolding(id) {
    holdingDetailsData.value = holdingDetailsData.value.filter(h => h.id !== id);
  };

  // 清空全部持股（重置）
  function clearHoldings() {
    holdingDetailsData.value = [];
  };


  // 計算屬性區域（Summary）---------
  const totalValue = computed(() => holdingDetailsData.value.reduce((s, h) => s + (Number(h.stockValue) || 0), 0));  // 總市值
  const totalValueExCash = computed(() => holdingDetailsData.value.filter(h => h.id !== null).reduce((s, h) => s + (Number(h.stockValue) || 0), 0));  // 不含現金的總市值
  const totalCost = computed(() => holdingDetailsData.value.reduce((s, h) => s + (Number(h.cost) * Number(h.shares) || 0), 0));  // 總成本

  const overallReturnPercent = computed(() => {
    if (!totalCost.value) return 0;  // 防止除以 0
    return ((totalValue.value - totalCost.value) / totalCost.value);
  });

  // 若你未來要把價格從 TWSE API 更新進 holdingDetailsData，可加一個方法：
  function updatePrices(priceMap) {
    // 參數格式：{ "2330.TW": 888, "00632R.TW": 21.6, ... }
    let changed = false;
    holdingDetailsData.value.forEach(h => {
      if (priceMap[h.id] != null) {        // 若 priceMap 有該股票
        h.price = Number(priceMap[h.id]);  // 更新現價
        h.value = h.price * h.shares;      // 重新計算市值
        changed = true;
      };
    });
    return changed;
  };

  return {
    holdingDetailsData,   // 持股明細（主要資料）
    addOrUpdateHolding,   // 新增 或 更新股票
    removeHolding,        // 刪除股票
    clearHoldings,        // 清空所有股票
    recalcValues,         // 重新計算數值（防止NaN）
    updatePrices,         // 從API更新價格
    totalValue,           // 總市值
    totalValueExCash,     // 不含現金的總市值
    totalCost,            // 總成本
    overallReturnPercent  // 總報酬率
  };
});
