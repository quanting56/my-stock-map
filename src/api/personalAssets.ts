import type { PersonalAssetsRawRow } from "@/types/personalAssets";

// 範例預設資料（開發與作為備援資料用）
// 若使用者第一次開啟、localStorage 沒有資料，就會使用這組 mock data
import assetsMockData from "@/data/mock/assetsMockData.json";


// 設定 localStorage 的 key 名稱，方便存取與維護
const STORAGE_KEY = "myStockMap_personalAssets";

function readStorage(): PersonalAssetsRawRow[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;

    return parsed as PersonalAssetsRawRow[];
  } catch (e) {
    console.error("localStorage 資料讀取錯誤：", e);
    return null;
  }
}

function writeStorage(rows: PersonalAssetsRawRow[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  } catch (e) {
    console.error("localStorage 寫入失敗：", e);
  }
}



// 取得 mock raw rows（永遠回傳新陣列）
export function getMockRawRows(): PersonalAssetsRawRow[] {
  return (assetsMockData as PersonalAssetsRawRow[]).map((r) => ({ ...r }));
}

// 寫入 raw rows 到 localStorage
export function saveRawRowsToStorage(rows: PersonalAssetsRawRow[]): void {
  writeStorage(rows);
}

// 從 localStorage 讀 raw rows；沒有就回傳 null
export function loadRawRowsFromStorage(): PersonalAssetsRawRow[] | null {
  return readStorage();
}

/**
 * 給 store 用的一站式載入：
 * - localStorage 有 -> 用 localStorage
 * - 沒有 -> 用 mock
 */
export function loadRawRowsOrMock(): PersonalAssetsRawRow[] {
  return loadRawRowsFromStorage() ?? getMockRawRows();
}
