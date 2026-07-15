<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4 overflow-auto">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">持倉明細</h3>
      <div class="text-xs text-[color:var(--color-secondary)]">資料即時性取決於 API</div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-[color:var(--color-secondary)]">
          <tr>
            <th class="text-left pr-3">股票</th>
            <th class="text-right px-3">數量</th>
            <th class="text-right px-3">現價</th>
            <th class="text-right px-3">市值</th>
            <th class="text-right px-3">今日損益</th>
            <th class="text-right px-3">權重</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="detail in details"
            :key="detail.id"
            class="border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-border)]/30 transition"
          >
            <td class="py-3 pr-3">
              <div class="font-medium">{{ detail.id }}</div>
              <div class="text-xs text-[color:var(--color-secondary)]">{{ detail.name }}</div>
            </td>
            <td class="text-right py-3 px-3">
              {{ isTotalValueHidden ? "＊＊＊" : detail.shares.toLocaleString() }}
            </td>
            <td class="text-right py-3 px-3">${{ detail.price }}</td>
            <td class="text-right py-3 px-3 font-medium">
              ${{ isTotalValueHidden ? " ＊＊＊" : detail.stockValue.toLocaleString() }}
            </td>
            <td
              class="text-right py-3 px-3"
              :class="[
                  detail.cost > detail.price
                  ? 'text-[color:var(--color-line3)]'
                  : 'text-[color:var(--color-line2)]'
              ]"
            >
              {{ detail.cost > detail.price ? '' : '+' }}{{ isTotalValueHidden ? " ＊＊＊" : ((detail.price - detail.cost) * detail.shares).toLocaleString() }}
            </td>
            <td class="text-right py-3 px-3">{{ (detail.ratio * 100).toFixed(2) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { usePortfolioStore } from "@/store/portfolio";

defineProps({
  isTotalValueHidden: {
    type: Boolean,
    default: false
  }
});

const portfolioStore = usePortfolioStore();

const details = computed(() => {
  return portfolioStore.holdingDetailsData
    .map((d) => ({
      ...d,
      ratio: portfolioStore.totalValueExCash ? d.stockValue / portfolioStore.totalValueExCash : 0
    }))
    .filter((d) => d.id !== null);  // 過濾掉「現金」
});
</script>

<style scoped></style>
