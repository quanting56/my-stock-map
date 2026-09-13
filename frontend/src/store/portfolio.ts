import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";

// 範例預設資料（開發與作為備援資料用）
// 若使用者第一次開啟、localStorage 沒有資料，就會使用這組 mock data
import { mockData } from "@/data/mock/portfolioData";

/**
 * 持股資料，供正式資料與 mockData 共用。
 *
 * - `id`: 例如 `CASH`、`2330.TW`
 * - `name`: 例如 `現金`、`台積電`
 */
export interface Holding {
  id: string; // 識別碼
  name: string; // 顯示名稱
  shares: number; // 持股數
  price: number; // 股票現價
  cost: number; // 成本價
  stockValue: number; // 股票現值
}

/**
 * 尚未正規化的原始資料。
 *
 * - `id`: 例如 `CASH`、`2330.TW`
 * - `name`: 例如 `現金`、`台積電`
 */
type HoldingLike = {
  id: string; // 識別碼
  name?: unknown; // 顯示名稱
  shares?: unknown; // 持股數
  price?: unknown; // 股票現價
  cost?: unknown; // 成本價
  stockValue?: unknown; // 股票現值
};

/** 正規化資料函式。 */
function normalizeHolding(h: HoldingLike): Holding {
  const id = String(h.id);
  const name = String(h.name) || id;
  const shares = Number(h.shares) || 0;
  const price = Number(h.price) || 0;
  const cost = Number(h.cost) || 0;
  const stockValue = shares * price;

  return { id, name, shares, price, cost, stockValue };
}

// 設定 localStorage 的 key 名稱，方便存取與維護
const STORAGE_KEY = "myStockMap_holdings";

export const usePortfolioStore = defineStore("portfolio", () => {
  // 從 localStorage 讀取使用者已儲存的資料（若沒資料，使用 mock data）
  const raw = localStorage.getItem(STORAGE_KEY);
  let initialSeed: HoldingLike[] = mockData;

  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        initialSeed = parsed as HoldingLike[];
      }
    } catch {
      initialSeed = mockData;
    }
  }

  const holdingDetailsData = ref<Holding[]>([]);

  // 確保每個項目都有值（若使用者只存 shares/price）
  function recalcValues(list: HoldingLike[]): void {
    holdingDetailsData.value = list.map((h) => normalizeHolding(h));
  }

  recalcValues(initialSeed);

  // 自動同步到 localStorage（深度監聽）
  watch(
    holdingDetailsData,
    (val) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
      } catch (e) {
        console.warn("存 localStorage 失敗", e); // 若超出容量或權限錯誤，顯示警告
      }
    },
    {
      deep: true,
    },
  );

  // ==================
  // 操作函式
  // ==================

  type HoldingInput = Partial<Holding> & Pick<Holding, "id">;

  /** 新增或更新持股資料（例如使用者輸入新的股票） */
  function addOrUpdateHolding(h: HoldingInput): void {
    // 正規化資料：確保所有欄位
    const normalized: Holding = normalizeHolding(h);

    // 找尋 id 相同的項目
    const idx = holdingDetailsData.value.findIndex((x) => x.id === h.id);

    if (idx === -1) {
      // 若找不到，代表是新增股票
      holdingDetailsData.value.push(normalized);
    } else {
      // 若已有該股票，更新原資料（用展開運算子合併）
      holdingDetailsData.value[idx] = {
        ...holdingDetailsData.value[idx],
        ...normalized,
      };
    }
  }

  // 根據 id 刪除持股
  function removeHolding(id: Holding["id"]): void {
    holdingDetailsData.value = holdingDetailsData.value.filter((h) => h.id !== id);
  }

  // 清空全部持股（重置）
  function clearHoldings(): void {
    holdingDetailsData.value = [];
  }

  // ===============
  // 計算屬性區域（Summary）
  // ===============

  // 總市值
  const totalValue = computed(() => holdingDetailsData.value.reduce((s, h) => s + h.stockValue, 0));

  // 不含現金的總市值
  const totalValueExCash = computed(() =>
    holdingDetailsData.value.filter((h) => h.id !== "CASH").reduce((s, h) => s + h.stockValue, 0),
  );

  // 總成本
  const totalCost = computed(() =>
    holdingDetailsData.value.reduce((s, h) => s + h.cost * h.shares, 0),
  );

  const overallReturnPercent = computed(() => {
    // 防止除以 0
    if (!totalCost.value) {
      return 0;
    }

    return (totalValue.value - totalCost.value) / totalCost.value;
  });

  // 批次更新持股現價與對應市值
  type PriceMap = Partial<Record<Holding["id"], number | null>>;

  function updatePrices(priceMap: PriceMap): boolean {
    // 參數格式：{ "2330.TW": 888, "00632R.TW": 21.6, ... }
    let changed = false;

    holdingDetailsData.value.forEach((h) => {
      // 若 priceMap 有該股票
      if (priceMap[h.id] != null) {
        h.price = Number(priceMap[h.id]); // 更新現價
        h.stockValue = h.price * h.shares; // 重新計算市值
        changed = true;
      }
    });

    return changed;
  }

  return {
    holdingDetailsData, // 持股明細（主要資料）
    addOrUpdateHolding, // 新增 或 更新股票
    removeHolding, // 刪除股票
    clearHoldings, // 清空所有股票
    recalcValues, // 重新計算數值（防止 NaN）
    updatePrices, // 從 API 更新價格
    totalValue, // 總市值
    totalValueExCash, // 不含現金的總市值
    totalCost, // 總成本
    overallReturnPercent, // 總報酬率
  };
});
