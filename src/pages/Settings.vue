<!-- src/pages/Settings.vue -->
<template>
  <div class="p-6">
    <!-- 頁面標題 + 重設按鈕 -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <!-- 頁面標題 -->
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">⚙️ 設定</h1>
        <p class="text-sm text-[color:var(--color-secondary)] mt-1">帳號、顯示、通知與整體偏好設定。</p>
      </div>

      <!-- 重設按鈕 -->
      <div class="flex items-center gap-3">
        <button
          @click="resetAll"
          class="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:brightness-90 transition"
        >
          重設全部
        </button>
      </div>
    </div>


    <!-- 一樓：主要設定 + 當前設定與快速操作 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 主要設定 -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-6 space-y-6">
        <!-- 個人設定 -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">個人設定</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex flex-col">
              <span class="text-sm text-[color:var(--color-secondary)]">顯示名稱</span>
              <input
                type="text"
                v-model="form.displayName"
                placeholder="可輸入暱稱"
                class="px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
              />
            </label>
            <label class="flex flex-col">
              <span class="text-sm text-[color:var(--color-secondary)]">E-mail</span>
              <input
                type="email"
                v-model="form.email"
                placeholder="請輸入電子郵件"
                class="px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
              />
            </label>
            <div>
              <label class="text-sm text-[color:var(--color-secondary)]">貨幣單位</label>
              <select v-model="form.monetaryUnit" class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
                <option value="TWD">新臺幣 TWD</option>
                <option value="USD">美元 USD</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-[color:var(--color-secondary)]">顯示精度</label>
              <select v-model="form.numberPrecision" class="w-full px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
                <option value="0">整數</option>
                <option value="2">小數 2 位</option>
                <option value="4">小數 4 位</option>
              </select>
            </div>
          </div>
        </section>


        <!-- 外觀設定 -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">外觀</h2>
          <div class="flex items-center gap-4 flex-wrap">
            <button
              @click="uiTheme.toggleUITheme"
              class="px-3 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition cursor-pointer"
            >
              現在主題：{{ uiTheme.isDarkMode ? '夜間' : '日間' }}
            </button>

            <label class="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                v-model="form.reduceMotion"
                disabled
              />
              <span class="text-sm text-[color:var(--color-secondary)] opacity-50"><s>減少動畫（減少動態效果）</s></span>
            </label>
          </div>
        </section>


        <!-- 通知（未來實作） -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">
            通知
            <span class="ml-3 text-xs text-[color:var(--color-secondary)]/80">※ 目前僅儲存偏好設定，尚未實作實際推播服務。</span>
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-25">
            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">價格提醒</div>
                <div class="text-xs text-[color:var(--color-secondary)]">當持股達到目標價時通知您</div>
              </div>
              <input type="checkbox" v-model="form.notifyPrice" disabled />
            </label>

            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">每日摘要</div>
                <div class="text-xs text-[color:var(--color-secondary)]">每日早上推播昨日總覽</div>
              </div>
              <input type="checkbox" v-model="form.notifyDaily" disabled />
            </label>

            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">交易異常</div>
                <div class="text-xs text-[color:var(--color-secondary)]">監控交易失敗或拒單狀態</div>
              </div>
              <input type="checkbox" v-model="form.notifyTrade" disabled />
            </label>

            <div class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div class="font-medium mb-1">推播頻率</div>
              <select
                v-model="form.notifyFrequency"
                disabled
                class="w-full px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]"
              >
                <option value="never">不推播</option>
                <option value="realtime">即時</option>  <!-- 後端實作後，預設改用這個 -->
                <option value="hourly">每小時</option>
                <option value="daily">每日</option>
              </select>
            </div>
          </div>
        </section>


        <!-- 儲存按鈕 -->
        <div class="flex justify-end">
          <button @click="saveSettings" class="px-5 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition">儲存設定</button>
        </div>

        
        <!-- 資料來源（API 列表） -->
        <section class="border-t border-[color:var(--color-border)] pt-6">
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">資料來源</h2>
          <div class="grid grid-cols-1 gap-3">
            <div class="px-5 py-4 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] gap-3">
              <h3 class="mb-3 font-medium">本網站使用之 API</h3>
              <ul class="list-disc space-y-2">
                <li
                  v-for="(d, i) in apiSources"
                  :key="i"
                  class="ml-4 text-sm text-[color:var(--color-secondary)]"
                >
                  {{ d.title }}｜{{ d.apiFrom }}<br />
                  <span class="text-xs break-all">{{ d.partialHyperlink }} ...</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <!-- 右：摘要 / 小工具 -->
      <aside class="card-theme rounded-2xl shadow p-4 space-y-4">
        <div>
          <h3 class="font-medium text-[color:var(--color-primary)]">當前設定</h3>
          <div class="text-sm text-[color:var(--color-secondary)] mt-2">
            <div>顯示名稱：<span class="font-medium">{{ form.displayName || "-" }}</span></div>
            <div>電子郵件：<span class="font-medium">{{ form.email || "-" }}</span></div>
            <div>貨幣單位：<span class="font-medium">{{ form.monetaryUnit }}</span></div>
            <div>顯示位數：<span class="font-medium">{{ form.numberPrecision == 0 ? "整數" : `小數後 ${form.numberPrecision} 位` }}</span></div>
            <div>暗色模式：<span class="font-medium">{{ uiTheme.isDarkMode ? "啟用" : "停用" }}</span></div>
          </div>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h3 class="font-medium text-[color:var(--color-primary)]">快速匯入 / 匯出</h3>
          <div class="flex flex-col gap-2 mt-2">
            <label class="inline-flex justify-center px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm cursor-pointer">
              匯入設定
              <input type="file" @change="onImportFile" class="hidden" />
            </label>
            <button @click="exportSettings" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm cursor-pointer">匯出設定（JSON）</button>
          </div>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h3 class="font-medium text-[color:var(--color-primary)]">帳戶</h3>
          <div class="mt-2">
            <button @click="signOut" class="px-3 py-1 rounded-md bg-red-600 text-white text-sm">登出</button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { reactive } from "vue";
import { useUIThemeStore } from "@/store/theme";

const uiTheme = useUIThemeStore();

const apiSources = [
  { title: "個股股價", apiFrom: "TWSE 證交所", partialHyperlink: "https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=" },
  { title: "個股基本資訊（殖利率、本益比、股價淨值比等）", apiFrom: "TWSE 證交所", partialHyperlink: "https://www.twse.com.tw/exchangeReport/BWIBBU?response=" },
  { title: "公司基本資料（公司代號、名稱、地址、資本額、發行股數等）", apiFrom: "TWSE 證交所", partialHyperlink: "https://openapi.twse.com.tw/v1/opendata/t18" },
  { title: "個股相關新聞", apiFrom: "Google News RSS", partialHyperlink: "https://news.google.com/rss/search?q=" },
  { title: "上市公司市值排名", apiFrom: "taifex 臺灣期貨交易所", partialHyperlink: "https://www.taifex.com.tw/cht/9/fut" },
  { title: "上櫃公司市值排名", apiFrom: "證券櫃檯買賣中心", partialHyperlink: "https://www.bq888.taifex.com.tw/cht/2/tPE" },
  { title: "公司基本資料（代碼、名稱、產業等）", apiFrom: "FinMind", partialHyperlink: "https://api.finmindtrade.com/api/v4/data?dataset=" },
  { title: "國內上市證券國際證券辨識號碼", apiFrom: "TWSE 證交所", partialHyperlink: "https://isin.twse.com.tw/isin/C_public.jsp?strMode=" },
  { title: "國內上櫃證券國際證券辨識號碼", apiFrom: "TWSE 證交所", partialHyperlink: "https://isin.twse.com.tw/isin/C_public.jsp?strMode=" }
];

// localStorage key
const STORAGE_KEY = "my-stock-map:settings";

// 表單初始值（可擴充）
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

// 複製到 reactive 表單（避免直接綁定 defaultSettings）
const form = reactive(loadSettings());

function resetAll() {
  if (!confirm("確定要重設所有設定並清空本地儲存嗎？")) return;
  Object.assign(form, { ...defaultSettings });
  localStorage.removeItem(STORAGE_KEY);
  alert("已重設為預設值");
}

/* helpers */
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore parse error
  }
  // return fresh copy
  return { ...defaultSettings };
}

function saveToStorage(payload) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/* 行為 */
function saveSettings() {
  saveToStorage(form);
  alert("設定已儲存（本地示範）");
}

function onImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      Object.assign(form, parsed);
      saveToStorage(form);
      alert("匯入並套用設定完成");
    } catch (err) {
      alert("匯入失敗：檔案不是正確的 JSON");
    }
  };
  reader.readAsText(file);
}

function exportSettings() {
  const data = JSON.stringify(form, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mst-settings.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function signOut() {
  // 實作登出流程（示範）
  alert("已登出（示範），請串實際認證流程");
}
</script>

<style scoped></style>
