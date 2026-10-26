<template>
  <Teleport to="body">
    <div
      v-if="props.isOpen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      class="fixed inset-0 z-100 flex items-center justify-center bg-black/40"
      @click.self="emit('close')"
    >
      <div
        class="flex max-h-[80dvh] w-[90vw] max-w-md flex-col rounded-2xl border border-border bg-surface p-6 text-foreground shadow-lg md:max-w-xl xl:max-w-2xl 2xl:max-w-3xl"
      >
        <h2
          id="welcome-modal-title"
          class="mb-4 text-xl font-bold text-brand"
        >
          哈囉{{ welcomeTitleDisplayName }}！歡迎來到 My Stock Map 👋
        </h2>

        <div class="min-h-0 flex-1 overflow-y-auto pr-2">
          <p class="mb-4 text-sm leading-6 text-foreground-muted">
            <strong>My Stock Map</strong>
            是一款用來管理個人投資組合與資產變化的可視化工具，使用者可使用此工具進行
            <strong>記帳</strong
            >、<strong>投資紀錄</strong>、<strong>回測投資組合</strong>，進而最佳化自己長期投資的持股配置。
          </p>

          <p class="mb-8 text-sm leading-6 text-foreground-muted italic">
            目前為 <strong>測試版</strong>，是為
            <strong>MVP（最小可行產品 Minimum Viable Product）</strong
            >，部分功能尚在建置中，若有相關建議或想法可來信討論（<a
              href="mailto:mystockmap2025@gmail.com"
              class="underline underline-offset-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              mystockmap2025@gmail.com</a
            >），在此感謝您的試用！
          </p>

          <h3 class="mb-1 text-foreground-muted">
            <strong class="text-brand">My Stock Map</strong>
            裡面，你可以：
          </h3>

          <ul class="mb-4 list-inside list-disc space-y-1 text-sm text-foreground-muted">
            <li>透過導覽列的搜尋，變更全站的 <strong>個股 / ETF 資訊</strong> 顯示。</li>

            <li>
              在
              <strong class="text-brand">🏠 Dashboard 大總覽</strong>
              頁面，可一覽
              <strong>自身總持股水位</strong
              >、<strong>預設股票近期趨勢</strong>、<strong>持倉明細</strong>、<strong
                >公司市值佔比</strong
              >
              等投資重要資訊。
            </li>

            <li>
              在
              <strong class="text-brand">💼 Portfolio 我的投資組合</strong>
              頁面，可關注
              <strong>自身總資產分布</strong
              >、<strong>個人資產變化圖</strong>、<strong>持股明細</strong>，並可在此頁
              <strong>編輯持股</strong>。
            </li>

            <li>
              在
              <strong class="text-brand">📈 Stock Detail 股票詳情</strong>
              頁面，可查看
              <strong>股票價格走勢</strong
              >、<strong>基本面摘要</strong>、<strong>持有時間圖</strong>、<strong>相關新聞與消息</strong>。
            </li>

            <li>
              在
              <strong class="text-brand">🔍 Backtest 回測模組</strong>
              頁面，可回測 <strong>多檔股票的滾動報酬率</strong>
              或
              <strong>不同策略下長期持有單檔股票的總報酬率</strong>。
            </li>
            <li>
              在
              <strong class="text-brand">📊 Reports 報表管理</strong>
              頁面，可以
              <strong>CSV</strong>、<strong>JSON</strong>、<strong>PDF</strong>
              等格式匯出多種
              <strong>近期報表</strong>，亦可將符合對應格式的報表於此頁面匯入網站。
            </li>

            <li>
              在
              <strong class="text-brand">⚙️ Settings 設定</strong>
              頁面，可在此進行 <strong>個人化設定</strong>（如
              <strong>顯示名稱</strong
              >、<strong>貨幣單位</strong>、<strong>小數顯示精度</strong>、<strong>外觀主題</strong>），同時提供
              <strong>匯出 / 匯入設定檔</strong>
              的功能。
            </li>

            <li>
              在
              <strong>Dashboard</strong> 與 <strong>Portfolio</strong>
              頁面可使用「🔧 隱藏總市值」功能保護隱私。
            </li>

            <li>
              <s>目前資料預設為示意範例，你可以依自己的持股調整。</s
              >（登入系統與資產紀錄的後台尚未建置完成，請先不要輸入資產）
            </li>

            <li class="mt-6">未來還會推出多項功能與多個圖表，敬請期待。</li>
          </ul>
        </div>

        <!-- TODO: 目前先每次重新整理都會出現，之後再做這個功能 -->
        <!--
        <label class="mb-4 flex cursor-pointer items-center gap-2 text-xs text-foreground-muted">
          <input
            v-model="dontShowAgain"
            type="checkbox"
            class="rounded border-border"
          />
          不要再顯示此提示
        </label>
        -->

        <div class="mt-5 flex shrink-0 justify-end gap-3">
          <button
            type="button"
            class="cursor-pointer rounded-lg border border-border bg-surface px-3 py-1 text-sm text-foreground transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:border-action"
            @click="emit('close')"
          >
            關閉
          </button>

          <button
            type="button"
            class="cursor-pointer rounded-lg border border-transparent bg-action px-3 py-1 text-sm text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:outline-2 active:outline-offset-2 active:outline-action"
            @click="emit('close')"
          >
            開始使用
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useSettingItemsStore } from "@/stores/settingItems";

const props = defineProps<{
  isOpen: boolean; // 是否顯示，由父層決定
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const settingItemsStore = useSettingItemsStore();

const welcomeTitleDisplayName = computed(() =>
  settingItemsStore.settings.displayName ? `，${settingItemsStore.settings.displayName}` : "",
);
</script>

<style scoped></style>
