<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow lg:col-span-2">
    <div class="mb-3 flex items-center justify-between">
      <h3 class="font-medium text-foreground-muted">持倉明細</h3>
      <div class="text-xs text-foreground-muted">資料即時性取決於 API</div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-foreground-muted">
          <tr>
            <th class="pr-3 text-left">股票</th>
            <th class="px-3 text-right">數量</th>
            <th class="px-3 text-right">現價</th>
            <th class="px-3 text-right">市值</th>
            <th class="px-3 text-right">未實現損益</th>
            <th class="px-3 text-right">未實現報酬率</th>
            <th class="px-3 text-right">權重</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="detail in details"
            :key="detail.id"
            class="border-t border-border transition-colors hover:bg-surface-hover"
          >
            <td class="py-3 pr-3">
              <div class="font-medium">{{ detail.id }}</div>
              <div class="text-xs text-foreground-muted">{{ detail.name }}</div>
            </td>

            <td class="px-3 py-3 text-right">
              {{
                detail.id === "CASH"
                  ? "—"
                  : isTotalValueHidden
                    ? "＊＊＊"
                    : detail.shares.toLocaleString()
              }}
            </td>

            <td class="px-3 py-3 text-right">
              {{ detail.id === "CASH" ? "—" : `$${detail.price}` }}
            </td>

            <td class="px-3 py-3 text-right font-medium">
              ${{ isTotalValueHidden ? " ＊＊＊" : detail.stockValue.toLocaleString() }}
            </td>

            <td
              class="px-3 py-3 text-right"
              :class="
                detail.id === 'CASH'
                  ? 'text-foreground-muted'
                  : detail.price >= detail.cost
                    ? 'text-gain'
                    : 'text-loss'
              "
            >
              {{
                detail.id === "CASH"
                  ? "—"
                  : isTotalValueHidden
                    ? " ＊＊＊"
                    : `${detail.profitLoss >= 0 ? "+" : ""}${detail.profitLoss.toLocaleString()}`
              }}
            </td>

            <td
              class="px-3 py-3 text-right"
              :class="
                detail.id === 'CASH' || detail.profitLossPercent === null
                  ? 'text-foreground-muted'
                  : detail.price >= detail.cost
                    ? 'text-gain'
                    : 'text-loss'
              "
            >
              {{
                detail.id === "CASH" || detail.profitLossPercent === null
                  ? "—"
                  : `${detail.profitLossPercent >= 0 ? "+" : ""}${detail.profitLossPercent.toFixed(2)}%`
              }}
            </td>

            <td class="px-3 py-3 text-right">{{ (detail.ratio * 100).toFixed(2) }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { usePortfolioStore, type Holding } from "@/stores/portfolio";

interface HoldingDetail extends Holding {
  ratio: number;
  profitLoss: number;
  profitLossPercent: number | null;
}

withDefaults(
  defineProps<{
    isTotalValueHidden?: boolean;
  }>(),
  {
    isTotalValueHidden: false,
  },
);

const portfolioStore = usePortfolioStore();

const details = computed<HoldingDetail[]>(() => {
  return portfolioStore.holdingDetailsData.map((holding) => ({
    ...holding,
    ratio: portfolioStore.totalValue ? holding.stockValue / portfolioStore.totalValue : 0,
    profitLoss: (holding.price - holding.cost) * holding.shares,
    profitLossPercent:
      holding.cost > 0 ? ((holding.price - holding.cost) / holding.cost) * 100 : null,
  }));
});
</script>

<style scoped></style>
