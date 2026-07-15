// 此 pinia 檔原命名為 settings.ts
// 因為會與檔案內的 settings 變數搞混
// 所以改命名為 settingItems.ts

import { defineStore } from "pinia";
import { reactive } from "vue";


type MonetaryUnit = "TWD" | "USD" | "JPY";
type NotifyFrequency = "never" | "daily" | "weekly" | "monthly" | "custom";

export interface SettingsState {
  displayName: string;
  email: string;
  monetaryUnit: MonetaryUnit;
  numberPrecision: number;
  reduceMotion: boolean;
  notifyPrice: boolean;
  notifyDaily: boolean;
  notifyTrade: boolean;
  notifyFrequency: NotifyFrequency;
};


// localStorage key
const STORAGE_KEY = "my-stock-map:settings";

// 表單初始值
const defaultSettings: SettingsState = {
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
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mergeSettings(parsed: unknown): SettingsState {
  if (!isRecord(parsed)) return { ...defaultSettings };
  return {
    ...defaultSettings,
    displayName: typeof parsed.displayName === "string" ? parsed.displayName : defaultSettings.displayName,
    email: typeof parsed.email === "string" ? parsed.email : defaultSettings.email,
    monetaryUnit: (parsed.monetaryUnit === "TWD" || parsed.monetaryUnit === "USD" || parsed.monetaryUnit === "JPY")
      ? parsed.monetaryUnit
      : defaultSettings.monetaryUnit,
    numberPrecision: typeof parsed.numberPrecision === "number" ? parsed.numberPrecision : defaultSettings.numberPrecision,
    reduceMotion: typeof parsed.reduceMotion === "boolean" ? parsed.reduceMotion : defaultSettings.reduceMotion,
    notifyPrice: typeof parsed.notifyPrice === "boolean" ? parsed.notifyPrice : defaultSettings.notifyPrice,
    notifyDaily: typeof parsed.notifyDaily === "boolean" ? parsed.notifyDaily : defaultSettings.notifyDaily,
    notifyTrade: typeof parsed.notifyTrade === "boolean" ? parsed.notifyTrade : defaultSettings.notifyTrade,
    notifyFrequency: (parsed.notifyFrequency === "never" || parsed.notifyFrequency === "daily" || parsed.notifyFrequency === "weekly" || parsed.notifyFrequency === "monthly" || parsed.notifyFrequency === "custom")
      ? parsed.notifyFrequency
      : defaultSettings.notifyFrequency
  };
}

function loadSettingsFromStorage(): SettingsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      return { ...defaultSettings, ...mergeSettings(parsed) };
    }
  } catch (e) {
    console.warn("[settings] 讀取 localStorage 失敗：", e);
  }
  // localStorage 沒資料的話，return fresh copy
  return { ...defaultSettings };
}

export const useSettingItemsStore = defineStore("settingItems", () => {
  // [STATE]：複製到 reactive 表單（避免直接綁定 defaultSettings）
  const settings = reactive<SettingsState>(loadSettingsFromStorage());

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
