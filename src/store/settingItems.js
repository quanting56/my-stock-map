// 此 pinia 檔原命名為 settings.js
// 因為會與檔案內的 settings 變數搞混
// 所以改命名為 settingItems.js

import { defineStore } from "pinia";
import { reactive } from "vue";

// localStorage key
const STORAGE_KEY = "my-stock-map:settings";

// 表單初始值
const defaultSettings = {
  displayName: "",
  email: "",
  monetaryUnit: "TWD",
  numberPrecision: 2,
  reduceMotion: false,
  notifyPrice: false,
  notifyDaily: false,
  notifyTrade: false,
  notifyFrequency: "never"
};

// helpers
function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn("[settings] 讀取 localStorage 失敗：", e);
  }
  // return fresh copy
  return { ...defaultSettings };
}

export const useSettingItemsStore = defineStore("settingItems", () => {
  // [STATE]：複製到 reactive 表單（避免直接綁定 defaultSettings）
  const settings = reactive(loadSettingsFromStorage());

  // [ACTION]：存回 localStorage
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("[settings] 寫入 localStorage 失敗：", e);
    }
  }

  // [ACTION]：重設為預設值 + 清除 localStorage
  function reset() {
    Object.assign(settings, defaultSettings);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn("[settings] 移除 localStorage 失敗：", e);
    }
  }

  return {
    settings,
    saveToStorage,
    reset
  };
});
