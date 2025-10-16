<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[color:var(--color-primary)]">💼 我的投資組合</h2>
      <button
        @click="openEditor()"
        class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] transition text-sm cursor-pointer"
      >
        ➕ 編輯數據
      </button>
    </div>


    <!-- 一樓：Summary Cards -->
    <SummaryCards></SummaryCards>

    <!-- 二樓：投資分布圖＋資產變化折線圖 -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：投資分布圖 -->
      <ShareholdingRatioChart></ShareholdingRatioChart>

      <!-- 右側：資產變化折線圖 -->
      <PropertyChart></PropertyChart>
    </div>

    <!-- 三樓：持股明細表 -->
    <HoldingDetails @edit-holding="openEditor"></HoldingDetails>

    <!-- Footer Notes -->
    <div class="text-xs text-[color:var(--color-secondary)] text-right">
      資料為示意用途，實際數據請以最新持股紀錄為準。
    </div>


    <!-- Modal: 編輯 / 新增持股（簡易） -->
    <div v-if="editorOpen" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/40" @click="closeEditor"></div>

      <div class="relative bg-[color:var(--color-card)] text-[color:var(--color-text)] rounded-lg shadow-lg w-[min(90%,640px)] p-6 z-10">
        <h3 class="text-lg font-semibold mb-4">{{ editMode === "edit" ? "編輯持股" : "新增持股" }}</h3>

        <form @submit.prevent="save">
          <div class="grid grid-cols-1 gap-3">
            <label>
              <div class="text-sm text-[color:var(--color-secondary)]">股票代碼 (id)</div>
              <input v-model="form.id" required class="w-full border p-2 rounded" />
            </label>

            <label>
              <div class="text-sm text-[color:var(--color-secondary)]">股票名稱</div>
              <input v-model="form.name" class="w-full border p-2 rounded" />
            </label>

            <label class="grid grid-cols-3 gap-2">
              <div>
                <div class="text-sm text-[color:var(--color-secondary)]">張數 / 股數</div>
                <input v-model.number="form.shares" type="number" min="0" class="w-full border p-2 rounded" />
              </div>
              <div>
                <div class="text-sm text-[color:var(--color-secondary)]">當前價格</div>
                <input v-model.number="form.price" type="number" step="0.01" class="w-full border p-2 rounded" />
              </div>
              <div>
                <div class="text-sm text-[color:var(--color-secondary)]">成本 (每股)</div>
                <input v-model.number="form.cost" type="number" step="0.01" class="w-full border p-2 rounded" />
              </div>
            </label>

            <div class="flex justify-end gap-2 mt-4">
              <button type="button" @click="closeEditor" class="px-4 py-2 rounded border">取消</button>
              <button type="submit" class="px-4 py-2 rounded bg-[color:var(--color-primary)] text-white">儲存</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import SummaryCards from "@/components/Portfolio/SummaryCards.vue";
import ShareholdingRatioChart from "@/components/Portfolio/ShareholdingRatioChart.vue";
import PropertyChart from "@/components/Portfolio/PropertyChart.vue";
import HoldingDetails from "@/components/Portfolio/HoldingDetails.vue";

import { ref } from "vue";
import { usePortfolioStore } from "@/store/portfolio";

const portfolioStore = usePortfolioStore();
const editorOpen = ref(false);
const editMode = ref("add");  // "add" | "edit"
const form = ref({
  id: "",
  name: "",
  shares: 0,
  price: 0,
  cost: 0
});

// 開啟編輯器Modal來"add"或"edit"，如果沒有holding，預先填滿
function openEditor(holding) {
  if (holding) {
    editMode.value = "edit";
    form.value = { ...holding };  // shallow copy
  } else {
    editMode.value = "add";
    form.value = { id: "", name: "", shares: 0, price: 0, cost: 0 };
  }
  editorOpen.value = true;
};

function closeEditor() {
  editorOpen.value = false;
};

// save -> addOrUpdate in store
function save() {
  if (!form.value.id) return;
  portfolioStore.addOrUpdateHolding(form.value);
  // recalc values (store automatically persists)
  portfolioStore.recalcValues();
  closeEditor();
};
</script>

<style scoped></style>
