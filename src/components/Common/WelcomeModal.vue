<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('close')"
    >
      <div class="card-theme w-[90vw] max-w-md md:max-w-xl xl:max-w-2xl 2xl:max-w-3xl rounded-2xl shadow-lg p-6 max-h-[80vh] flex flex-col">
        <h2 class="text-xl font-bold mb-4 text-[color:var(--color-primary)]">
          哈囉{{ settingItems.settings.displayName ? `，${settingItems.settings.displayName}` : "" }}！歡迎來到 My Stock Map 👋
        </h2>

        <div class="overflow-y-auto flex-1 pr-2">
          <p class="text-sm text-[color:var(--color-secondary)] mb-4 leading-6">
            <strong>My Stock Map</strong> 是一款用來管理個人投資組合與資產變化的可視化工具，使用者可使用此工具進行 <strong>記帳</strong>、<strong>投資紀錄</strong>、<strong>回測投資組合</strong>，進而最佳化自己長期投資的持股配置。
          </p>
          <p class="text-sm text-[color:var(--color-secondary)] mb-8 leading-6">
            <i>目前為 <strong>測試版</strong>，是為 <b>MVP（最小可行產品 Minimum Viable Product）</b>，部分功能尚在建置中，若有相關建議或想法可來信討論（ <a href="mailto:mystockmap2025@gmail.com" class="underline underline-offset-2 hover:text-[color:var(--color-primary)]">mystockmap2025@gmail.com</a> ），在此感謝您的試用！</i>
          </p>
  
          <h3 class="text-[color:var(--color-secondary)] mb-1"><strong class="text-[color:var(--color-primary)]">My Stock Map</strong> 裡面，你可以：</h3>
          <ul class="text-sm text-[color:var(--color-secondary)] space-y-1 mb-4 list-disc list-inside">
            <li>透過導覽列的搜尋，變更全站的 <b>個股 / ETF 資訊</b> 顯示。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">🏠 Dashboard 大總覽</strong> 頁面，可一覽 <strong>自身總持股水位</strong>、<strong>預設股票近期趨勢</strong>、<strong>持倉明細</strong>、<strong>公司市值佔比</strong> 等投資重要資訊。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">💼 Portfolio 我的投資組合</strong> 頁面，可關注 <strong>自身總資產分布</strong>、<strong>個人資產變化圖</strong>、<strong>持股明細</strong>，並可在此頁 <strong>編輯持股</strong>。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">📈 Stock Detail 股票詳情</strong> 頁面，可查看 <strong>股票價格走勢</strong>、<strong>基本面摘要</strong>、<strong>持有時間圖</strong>、<strong>相關新聞與消息</strong>。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">🔍 Backtest 回測模組</strong> 頁面，可回測 <strong>多檔股票的滾動報酬率</strong> 或 <strong>不同策略下長期持有單檔股票的總報酬率</strong>。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">📊 Reports 報表管理</strong> 頁面，可以 <b>CSV</b>、<b>JSON</b>、<b>PDF</b> 等格式匯出多種 <strong>近期報表</strong>，亦可將符合對應格式的報表於此頁面匯入網站。</li>
            <li>在 <strong class="text-[color:var(--color-primary)]">⚙️ Settings 設定</strong> 頁面，可在此進行 <strong>個人化設定</strong>（如 <strong>顯示名稱</strong>、<strong>貨幣單位</strong>、<strong>小數顯示精度</strong>、<strong>外觀主題</strong>），同時提供 <strong>匯出 / 匯入設定檔</strong> 的功能。</li>
            <li>在 <strong>Dashboard</strong> 與 <strong>Portfolio</strong> 頁面可使用「🔧 隱藏總市值」功能保護隱私。</li>
            <li><s>目前資料預設為示意範例，你可以依自己的持股調整。</s>（登入系統與資產紀錄的後台尚未建置完成，請先不要輸入資產）</li>
            <br />
            <li>未來還會推出多項功能與多個圖表，敬請期待。</li>
          </ul>
        </div>

        <!-- 目前先每次重新整理都會出現，之後再做這個功能 -->
        <!-- <label class="flex items-center gap-2 text-xs text-[color:var(--color-secondary)] mb-4 cursor-pointer">
          <input
            type="checkbox"
            v-model="dontShowAgain"
            class="rounded border-[color:var(--color-border)]"
          />
          不要再顯示此提示
        </label> -->

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="px-3 py-1 text-sm rounded-lg border border-[color:var(--color-border)] hover:bg-[color:var(--color-border)] cursor-pointer"
            @click="emit('close')"
          >
            關閉
          </button>
          <button
            type="button"
            class="px-3 py-1 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            @click="emit('close')"
          >
            開始使用
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useSettingItemsStore } from "@/store/settingItems.js";

const settingItems = useSettingItemsStore();

const props = defineProps({
  open: { type: Boolean, default: true },  // 是否顯示，由父層決定
});

const emit = defineEmits(["close"]);
</script>

<style scoped></style>
