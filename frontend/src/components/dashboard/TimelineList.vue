<template>
  <div class="rounded-2xl bg-surface p-4 text-foreground shadow">
    <h3 class="mb-3 font-medium">📅 最近事件</h3>

    <ul class="space-y-3">
      <li
        v-for="event in demoEvents"
        :key="event.id"
        class="flex items-start gap-3"
      >
        <time
          :datetime="event.date"
          class="w-20 shrink-0 text-xs text-foreground-muted"
        >
          {{ event.date }}
        </time>

        <div class="min-w-0">
          <div class="font-medium">
            {{ event.title }}
          </div>

          <div class="text-xs text-foreground-muted">
            {{ formatEventAmount(event.amount) }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  amount: number;
}

// TODO: Prototype 假資料，未來串接正式事件 API
// 可能會有交易、股息、股票分割、資金轉入、備忘錄等事件
const demoEvents: TimelineEvent[] = [
  {
    id: "demo-1",
    date: "2025-10-07",
    title: "加碼 00675L",
    amount: 5000,
  },
  {
    id: "demo-2",
    date: "2025-10-05",
    title: "台積電配息",
    amount: 1200,
  },
];

// TODO: 未來再決定是否要使用 utils/format/number.ts 的 formatAmount()
const eventAmountFormatter = new Intl.NumberFormat("zh-TW", {
  useGrouping: true,
  maximumFractionDigits: 0,
});

function formatEventAmount(amount: number): string {
  return `$${eventAmountFormatter.format(amount)}`;
}
</script>

<style scoped></style>
