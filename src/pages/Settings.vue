<!-- src/pages/Settings.vue -->
<template>
  <div class="p-6">
    <!-- 標題區 -->
    <div class="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-[color:var(--color-primary)]">⚙️ 設定</h1>
        <p class="text-sm text-[color:var(--color-secondary)] mt-1">帳號、顯示、通知與整體偏好設定。</p>
      </div>

      <!-- 快速動作 -->
      <div class="flex items-center gap-3">
        <button
          @click="exportSettings"
          class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm hover:bg-[color:var(--color-border)] transition"
        >
          匯出設定
        </button>
        <label class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm cursor-pointer hover:bg-[color:var(--color-border)] transition">
          匯入設定
          <input type="file" @change="onImportFile" class="hidden" />
        </label>
        <button
          @click="resetAll"
          class="px-3 py-1 rounded-md bg-red-600 text-white text-sm hover:brightness-90 transition"
        >
          重設全部
        </button>
      </div>
    </div>

    <!-- 內容：左（主要設定）、右（摘要與快速操作） -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左：表單區 -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-6 space-y-6">
        <!-- 個人設定 -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">個人設定</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input v-model="form.displayName" placeholder="顯示名稱" class="px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" />
            <input v-model="form.email" placeholder="電子郵件" class="px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" />
            <select v-model="form.timezone" class="px-3 py-2 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <option value="Asia/Taipei">Asia/Taipei</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
            </select>
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

        <!-- 顯示 / 主題設定 -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">外觀 (Theme)</h2>
          <div class="flex items-center gap-4 flex-wrap">
            <button
              @click="uiTheme.isDarkMode ? uiTheme.toggleUITheme() : null"
              :class="[
                'px-3 py-2 rounded-lg border transition',
                uiTheme.isDarkMode ? 'bg-[color:var(--color-card)] border-[color:var(--color-border)]' : 'bg-white border-gray-200'
              ]"
            >
              現在：{{ uiTheme.isDarkMode ? '夜間' : '日間' }}
            </button>

            <button
              @click="uiTheme.toggleUITheme"
              class="px-3 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition cursor-pointer"
            >
              切換主題
            </button>

            <label class="flex items-center gap-2 ml-2">
              <input type="checkbox" v-model="form.reduceMotion" disabled />
              <span class="text-sm text-[color:var(--color-secondary)] opacity-50"><s>減少動畫（減少動態效果）</s></span>
            </label>
          </div>
        </section>

        <!-- 通知 -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">通知</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">價格提醒</div>
                <div class="text-xs text-[color:var(--color-secondary)]">當持股達到目標價時通知您</div>
              </div>
              <input type="checkbox" v-model="form.notifyPrice" />
            </label>

            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">每日摘要</div>
                <div class="text-xs text-[color:var(--color-secondary)]">每日早上推播昨日總覽</div>
              </div>
              <input type="checkbox" v-model="form.notifyDaily" />
            </label>

            <label class="flex items-center justify-between p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div>
                <div class="font-medium">交易異常</div>
                <div class="text-xs text-[color:var(--color-secondary)]">監控交易失敗或拒單狀態</div>
              </div>
              <input type="checkbox" v-model="form.notifyTrade" />
            </label>

            <div class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
              <div class="font-medium mb-1">推播頻率</div>
              <select v-model="form.notifyFrequency" class="w-full px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]">
                <option value="realtime">即時</option>
                <option value="hourly">每小時</option>
                <option value="daily">每日</option>
              </select>
            </div>
          </div>
        </section>

        <!-- API Key -->
        <section>
          <h2 class="text-lg font-medium text-[color:var(--color-primary)] mb-2">API / Integrations</h2>
          <div class="grid grid-cols-1 gap-3">
            <div class="p-3 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)] flex items-center gap-3">
              <div class="flex-1">
                <div class="text-sm text-[color:var(--color-secondary)]">第三方行情 API Key</div>
                <div class="text-xs text-[color:var(--color-secondary)]">此金鑰會存在 localStorage（示範），上線請改用安全後端儲存。</div>
              </div>

              <div class="flex items-center gap-2">
                <input v-model="form.apiKey" :type="showKey ? 'text' : 'password'" placeholder="輸入 API Key" class="px-2 py-1 rounded-md bg-[color:var(--color-card)] border border-[color:var(--color-border)]" />
                <button @click="showKey = !showKey" class="px-2 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm">
                  {{ showKey ? '隱藏' : '顯示' }}
                </button>
                <button @click="clearApiKey" class="px-2 py-1 rounded-md bg-red-600 text-white text-sm hover:brightness-95">清除</button>
              </div>
            </div>

            <div class="text-xs text-[color:var(--color-secondary)]">注意：不要在公開 repo 或 client-side 存放敏感金鑰。</div>
          </div>
        </section>

        <!-- 儲存按鈕 -->
        <div class="flex justify-end">
          <button @click="saveSettings" class="px-5 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition">儲存設定</button>
        </div>
      </div>

      <!-- 右：摘要 / 小工具 -->
      <aside class="card-theme rounded-2xl shadow p-4 space-y-4">
        <div>
          <h3 class="font-medium text-[color:var(--color-primary)]">當前設定</h3>
          <div class="text-sm text-[color:var(--color-secondary)] mt-2">
            <div>顯示名稱：<span class="font-medium">{{ form.displayName || "-" }}</span></div>
            <div>電子郵件：<span class="font-medium">{{ form.email || "-" }}</span></div>
            <div>時區：<span class="font-medium">{{ form.timezone }}</span></div>
            <div>暗色模式：<span class="font-medium">{{ uiTheme.isDarkMode ? "啟用" : "停用" }}</span></div>
          </div>
        </div>

        <div class="border-t border-[color:var(--color-border)] pt-3">
          <h3 class="font-medium text-[color:var(--color-primary)]">快速匯入 / 匯出</h3>
          <div class="flex flex-col gap-2 mt-2">
            <button @click="exportSettings" class="px-3 py-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-sm">匯出 JSON</button>
            <button @click="loadDefault" class="px-3 py-1 rounded-md bg-[color:var(--color-primary)] text-white text-sm">載入預設</button>
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
import { reactive, ref } from "vue";
import { useUIThemeStore } from "@/store/theme";

const uiTheme = useUIThemeStore();

// localStorage key
const STORAGE_KEY = "my-stock-map:settings";

// 表單初始值（可擴充）
const defaultSettings = {
  displayName: "",
  email: "",
  timezone: "Asia/Taipei",
  numberPrecision: 2,
  reduceMotion: false,
  notifyPrice: true,
  notifyDaily: false,
  notifyTrade: true,
  notifyFrequency: "daily",
  apiKey: ""
};

// 複製到 reactive 表單（避免直接綁定 defaultSettings）
const form = reactive(loadSettings());

// 顯示 API Key 開關
const showKey = ref(false);

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

function onImportJson(json) {
  // 若要從程式中匯入
  Object.assign(form, json);
  saveToStorage(form);
}

function resetAll() {
  if (!confirm("確定要重設所有設定並清空本地儲存嗎？")) return;
  Object.assign(form, { ...defaultSettings });
  localStorage.removeItem(STORAGE_KEY);
  alert("已重設為預設值");
}

function loadDefault() {
  Object.assign(form, { ...defaultSettings });
  saveToStorage(form);
  alert("已載入預設設定");
}

function clearApiKey() {
  form.apiKey = "";
  saveToStorage(form);
  alert("API Key 已清除（本地示範）");
}

function signOut() {
  // 實作登出流程（示範）
  alert("已登出（示範），請串實際認證流程");
}
</script>

<style scoped></style>
