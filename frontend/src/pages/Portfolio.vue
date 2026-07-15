<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[color:var(--color-primary)]">💼 我的投資組合</h2>
      <div class="flex gap-3">
        <button
          @click="editorOpen = !editorOpen"
          class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] active:ring-2 active:ring-offset-1 active:ring-[var(--color-line1)] transition text-sm cursor-pointer"
        >
          ➕ 編輯數據
        </button>
        <button
          @click="isHidden = !isHidden"
          class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] active:ring-2 active:ring-offset-1 active:ring-[var(--color-line1)] transition text-sm cursor-pointer"
        >
          🔧 {{ isHidden ? '顯示總市值' : '隱藏總市值' }}
        </button>
      </div>
    </div>

    <!-- Modal: 編輯 / 新增持股 -->
    <Teleport to="body">
      <EditHoldingModal
        v-if="editorOpen"
        @close="editorOpen = !editorOpen"
      ></EditHoldingModal>
    </Teleport>


    <!-- 一樓：Summary Cards -->
    <SummaryCards :isTotalValueHidden="isHidden"></SummaryCards>

    <!-- 二樓：投資分布圖＋資產變化折線圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：投資分布圖 -->
      <ShareholdingRatioChart :isTotalValueHidden="isHidden"></ShareholdingRatioChart>

      <!-- 右側：資產變化折線圖 -->
      <PersonalAssetsChart :isTotalValueHidden="isHidden"></PersonalAssetsChart>
    </div>

    <!-- 三樓：持股明細表 -->
    <HoldingDetails
      :isTotalValueHidden="isHidden"
      @edit-holding="editorOpen = !editorOpen"
    ></HoldingDetails>

    <!-- Footer Notes -->
    <div class="text-xs text-[color:var(--color-secondary)] text-right">
      資料為示意用途，實際數據請以最新持股紀錄為準。
    </div>

    <!-- 四樓：個人資產蠟燭圖 -->
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import EditHoldingModal from "@/components/Common/EditHoldingModal.vue";
import SummaryCards from "@/components/Portfolio/SummaryCards.vue";
import ShareholdingRatioChart from "@/components/Portfolio/ShareholdingRatioChart.vue";
import PersonalAssetsChart from "@/components/Portfolio/PersonalAssetsChart.vue";
import HoldingDetails from "@/components/Portfolio/HoldingDetails.vue";

const isHidden = ref(false);
const editorOpen = ref(false);
</script>

<style scoped></style>
