<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <div class="flex items-center mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">持股明細</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead class="border-b border-[color:var(--color-border)] text-[color:var(--color-secondary)]">
          <tr>
            <th class="text-left py-2 pr-3">股票名稱</th>
            <th class="text-right py-2 px-3">資金比例</th>
            <th class="text-right py-2 px-3">現價</th>
            <th class="text-right py-2 px-3">成本</th>
            <th class="text-right py-2 px-3">報酬率</th>
            <th class="text-right py-2 px-3">市值</th>
            <th class="text-right py-2 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="detail in details"
            :key="detail.id"
            class="hover:bg-[color:var(--color-border)]/30 transition"
          >
            <td class="py-2 pr-3 font-medium">{{ detail.name }}{{ detail.id ? ` (${detail.id})` : "" }}</td>
            <td class="text-right py-2 px-3">
              {{ isTotalValueHidden ? "＊＊＊ " : (detail.ratio * 100).toFixed(2) }}%
            </td>
            <td class="text-right py-2 px-3">
              ${{ (isTotalValueHidden && !detail.id) ? " ＊＊＊" : (detail.price || 0).toLocaleString() }}
            </td>
            <td class="text-right py-2 px-3">
              ${{ (isTotalValueHidden && !detail.id) ? " ＊＊＊" : (detail.cost || 0).toLocaleString() }}
            </td>
            <td
              class="text-right py-2 px-3"
              :class="[
                detail.cost > detail.price
                ? 'text-[color:var(--color-line3)]'
                : 'text-[color:var(--color-line2)]'
              ]"
            >
              <template v-if="detail.cost == 0">零成本</template>
              <template v-else>
                {{ detail.cost > detail.price ? '' : '+' }}{{ ((detail.price - detail.cost) / detail.cost * 100).toFixed(2) }}%
              </template>
            </td>
            <td class="text-right py-2 px-3">
              ${{ isTotalValueHidden ? " ＊＊＊" : (detail.stockValue || 0).toLocaleString() }}
            </td>
            <td class="text-right py-2 px-3">
              <button @click="emit('edit-holding', detail)" class="px-2 py-1 mr-2 rounded border border-theme hover:border-[color:var(--color-primary)] cursor-pointer">
                ✏️
              </button>
              <button @click="remove(detail.id)" class="px-2 py-1 rounded border border-theme hover:border-[color:var(--color-primary)] cursor-pointer">
                🗑️
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePortfolioStore } from "@/stores/portfolio";

const portfolioStore = usePortfolioStore();

defineProps({
  isTotalValueHidden: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["edit-holding"]);

const details = computed(() => {
  const totalValue = portfolioStore.totalValue || 1;
  return portfolioStore.holdingDetailsData.map(d => ({
    ...d,
    ratio: d.stockValue / totalValue
  }));
});

function remove(id) {
  if (!confirm("確定刪除")) return;
  portfolioStore.removeHolding(id);
};
</script>

<style scoped></style>
