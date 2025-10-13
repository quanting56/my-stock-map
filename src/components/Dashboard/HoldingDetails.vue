<template>
  <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4 overflow-auto">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">持倉明細</h3>
      <div class="text-xs text-[color:var(--color-secondary)]">資料即時性取決於 API</div>
    </div>

    <table class="w-full text-sm">
      <thead class="text-[color:var(--color-secondary)]">
        <tr>
          <th class="text-left">股票</th>
          <th class="text-right">數量</th>
          <th class="text-right">現價</th>
          <th class="text-right">市值</th>
          <th class="text-right">今日損益</th>
          <th class="text-right">權重</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-t border-[color:var(--color-border)]">
          <td class="py-3">
            <div class="font-medium">TSM</div>
            <div class="text-xs text-[color:var(--color-secondary)]">台積電</div>
          </td>
          <td class="py-3 text-right">120</td>
          <td class="py-3 text-right">$520</td>
          <td class="py-3 text-right font-medium">$62,400</td>
          <td class="py-3 text-right text-[color:var(--color-line2)]">
            $4,800
          </td>
          <td class="py-3 text-right">85.4%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup></script>

<style scoped></style>
