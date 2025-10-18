<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div
      class="relative bg-[color:var(--color-card)] text-[color:var(--color-text)] rounded-lg shadow-lg w-[min(90%,900px)] p-6 z-10"
    >
      <h3 class="text-lg font-semibold mb-4">編輯持股資料</h3>

      <!-- 改成表格輸入形式 -->
      <form>
        <div class="overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead class="border-b border-[color:var(--color-border)] text-[color:var(--color-secondary)]">
              <tr>
                <th class="text-left py-2 px-3">股票代碼 (id)</th>
                <th class="text-left py-2 px-3">股票名稱</th>
                <th class="text-right py-2 px-3">股數</th>
                <th class="text-right py-2 px-3">現價</th>
                <th class="text-right py-2 px-3">成本</th>
                <th class="text-right py-2 px-3">操作</th>
              </tr>
            </thead>

            <tbody>
              <!-- 既有資料 -->
              <tr
                v-for="(item, index) in editableData"
                :key="index"
                class="border-b border-[color:var(--color-border)] hover:bg-[color:var(--color-border)]/30 transition"
              >
                <td class="py-2 px-3"><input v-model="item.id" class="w-full border p-1 rounded" /></td>
                <td class="py-2 px-3"><input v-model="item.name" class="w-full border p-1 rounded" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="item.shares" type="number" min="0" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="item.price" type="number" step="0.01" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="item.cost" type="number" step="0.01" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right">
                  <button type="button" @click="removeRow(index)" class="px-2 py-1 rounded border cursor-pointer hover:bg-[color:var(--color-border)]">🗑️</button>
                </td>
              </tr>

              <!-- 新增列 -->
              <tr class="bg-[color:var(--color-border)]/20">
                <td class="py-2 px-3"><input v-model="newRow.id" class="w-full border p-1 rounded" placeholder="新股票代碼" /></td>
                <td class="py-2 px-3"><input v-model="newRow.name" class="w-full border p-1 rounded" placeholder="名稱" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="newRow.shares" type="number" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="newRow.price" type="number" step="0.01" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right"><input v-model.number="newRow.cost" type="number" step="0.01" class="w-full border p-1 rounded text-right" /></td>
                <td class="py-2 px-3 text-right">
                  <button
                    type="button"
                    @click="addNewRow"
                    class="px-2 py-1 rounded border cursor-pointer hover:bg-[color:var(--color-border)]"
                  >
                    ➕
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex justify-end gap-2 mt-5">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded border cursor-pointer hover:bg-[color:var(--color-border)] active:ring-2 active:ring-offset-1 active:ring-[var(--color-line1)] transition"
          >
            取消
          </button>
          <button
            type="button"
            @click="saveAll"
            @keyup.enter="saveAll"
            class="px-4 py-2 rounded border bg-[color:var(--color-primary)] text-white cursor-pointer hover:bg-[color:var(--color-line1)] active:ring-2 active:ring-offset-1 active:ring-[var(--color-line1)] transition"
          >
            儲存
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { usePortfolioStore } from "@/store/portfolio";

const portfolioStore = usePortfolioStore();
const emit = defineEmits(["close"]);

const editableData = computed({
  get: () => portfolioStore.holdingDetailsData,
  set: (val) => portfolioStore.holdingDetailsData = val
});
  
const newRow = ref({ id: "", name: "", shares: 0, price: 0, cost: 0 });  // 新增列資料

// 儲存所有資料
function saveAll() {
  // 若有新增項目，推進去
  if (newRow.value.id) editableData.value.push({ ...newRow.value });

  // 直接覆蓋 store（因為 editableData 是 reactive copy）
  portfolioStore.holdingDetailsData = editableData.value;
  portfolioStore.recalcValues();

  newRow.value = { id: "", name: "", shares: 0, price: 0, cost: 0 };
  emit("close");
};

// 刪除列
function removeRow(index) {
  editableData.value.splice(index, 1);
  portfolioStore.holdingDetailsData = editableData.value;
};

// 新增列
function addNewRow() {
  if (!newRow.value.id) return;
  editableData.value.push({ ...newRow.value });
  newRow.value = { id: "", name: "", shares: 0, price: 0, cost: 0 };
};
</script>

<style scoped></style>
