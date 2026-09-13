import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";

import { loadRawRowsOrMock, getMockRawRows, saveRawRowsToStorage } from "@/api/personalAssets";
import { rawToRow, rowToRaw, parseRows, getBankKeys } from "@/utils/portfolio/personalAssets";

import type {
  PersonalAssetsRawRow,
  PersonalAssetsRow,
  PersonalAssetsParsedRow,
} from "@/types/personalAssets";

export const usePersonalAssetsStore = defineStore("personalAssets", () => {
  // 以 raw rows 作為 single source of truth，方便持久化至 localStorage 並沿用 mock 格式
  const rawRows = ref<PersonalAssetsRawRow[]>([]);
  const isReady = ref(false);

  function init() {
    if (isReady.value) {
      return;
    }

    rawRows.value = loadRawRowsOrMock();
    isReady.value = true;
  }

  /** 供 UI 使用的正規化資產資料。 */
  const rows = computed<PersonalAssetsRow[]>(() => {
    return rawRows.value.map(rawToRow).filter((r): r is PersonalAssetsRow => r != null);
  });

  /** 供圖表與數值計算使用的解析後資產資料。 */
  const parsedRows = computed<PersonalAssetsParsedRow[]>(() => parseRows(rows.value));

  /** 所有資產欄位 keys。 */
  const bankKeys = computed<string[]>(() => getBankKeys(rows.value));

  // Actions：讓元件用 PersonalAssetsRow 操作（不要讓元件碰 raw）
  // setRows / resetToMock / upsertRow / deleteRow 都只吃 Row
  function setRows(next: PersonalAssetsRow[]) {
    rawRows.value = next.map(rowToRaw); // 用 rawRows 當唯一真相
  }

  function resetToMock() {
    rawRows.value = getMockRawRows();
  }

  function upsertRow(next: PersonalAssetsRow) {
    const targetDate = next["日期"];
    const idx = rawRows.value.findIndex((r) => String(r["日期"] ?? "").trim() === targetDate);

    const nextRaw = rowToRaw(next);

    if (idx >= 0) {
      // replace
      rawRows.value.splice(idx, 1, nextRaw);
    } else {
      // insert
      rawRows.value.push(nextRaw);
    }
  }

  function deleteRowByDate(dateStr: string) {
    const idx = rawRows.value.findIndex((r) => String(r["日期"] ?? "").trim() === dateStr.trim());

    if (idx >= 0) {
      rawRows.value.splice(idx, 1);
    }
  }

  watch(
    rawRows,
    (next) => {
      if (!isReady.value) {
        return;
      }

      saveRawRowsToStorage(next);
    },
    { deep: true },
  );

  return {
    rawRows,
    isReady,

    // UI/Chart 主要讀這些
    rows,
    parsedRows,
    bankKeys,

    // lifecycle & actions
    init,
    setRows,
    resetToMock,
    upsertRow,
    deleteRowByDate,
  };
});
