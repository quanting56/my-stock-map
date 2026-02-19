import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";

import {
  rawToRow,
  rowToRaw,
  parseRows,
  getBankKeys
} from "@/utils/portfolio/personalAssets";

import type {
  PersonalAssetsRawRow,
  PersonalAssetsRow,
  PersonalAssetsParsedRow
} from "@/types/personalAssets";

import {
  loadRawRowsOrMock,
  getMockRawRows,
  saveRawRowsToStorage
} from "@/api/personalAssets";

export const usePersonalAssetsStore = defineStore("personalAssets", () => {
  // State：用 raw 當 source of truth（方便存 localStorage，沿用 mock 格式）
  const rawRows = ref<PersonalAssetsRawRow[]>([]);
  const isReady = ref(false);

  function init() {
    if (isReady.value) return;

    rawRows.value = loadRawRowsOrMock();
    isReady.value = true;
  }

  // 可以給 UI 用的「正規化 Row」
  const rows = computed<PersonalAssetsRow[]>(() => {
    return rawRows.value.map(rawToRow)
                        .filter((r): r is PersonalAssetsRow => r != null);
  });

  // 給圖表用的 Parsed
  const parsedRows = computed<PersonalAssetsParsedRow[]>(() => parseRows(rows.value));

  // 欄位 keys（銀行欄位）
  const bankKeys = computed<string[]>(() => getBankKeys(rows.value));


  // Actions：讓元件用 PersonalAssetsRow 操作（不要讓元件碰 raw）
  // setRows / resetToMock / upsertRow / deleteRow 都只吃 Row
  function setRows(next: PersonalAssetsRow[]) {
    rawRows.value = next.map(rowToRaw);  // 用 rawRows 當唯一真相
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
    if (idx >= 0) { rawRows.value.splice(idx, 1); }
  }

  watch(
    rawRows,
    (next) => {
      if (!isReady.value) { return; }
      saveRawRowsToStorage(next);
    },
    { deep: true }
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
    deleteRowByDate
  };
});
