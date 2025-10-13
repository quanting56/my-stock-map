<template>
  <div class="card-theme rounded-2xl shadow p-4">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium mb-3">📋 持股明細</h3>
      <div class="text-xs text-[color:var(--color-secondary)]">編輯</div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-sm border-collapse">
        <thead class="border-b border-[color:var(--color-border)] text-[color:var(--color-secondary)]">
          <tr>
            <th class="text-left py-2 px-3">股票名稱</th>
            <th class="text-right py-2 px-3">持股比例</th>
            <th class="text-right py-2 px-3">現價</th>
            <th class="text-right py-2 px-3">成本</th>
            <th class="text-right py-2 px-3">報酬率</th>
            <th class="text-right py-2 px-3">市值</th>
          </tr>
        </thead>
        <tbody>
          <tr class="hover:bg-[color:var(--color-border)]/30 transition">
            <td class="py-2 px-3 font-medium">台積電 (2330)</td>
            <td class="text-right py-2 px-3">41.5%</td>
            <td class="text-right py-2 px-3">$890</td>
            <td class="text-right py-2 px-3">$650</td>
            <td class="text-right py-2 px-3 text-[color:var(--color-line2)]">+36.9%</td>
            <td class="text-right py-2 px-3">$516,000</td>
          </tr>
          <tr class="hover:bg-[color:var(--color-border)]/30 transition">
            <td class="py-2 px-3 font-medium">00675L 元大台灣50反1</td>
            <td class="text-right py-2 px-3">31.4%</td>
            <td class="text-right py-2 px-3">$21.5</td>
            <td class="text-right py-2 px-3">$20.2</td>
            <td class="text-right py-2 px-3 text-[color:var(--color-line2)]">+6.4%</td>
            <td class="text-right py-2 px-3">$391,000</td>
          </tr>
          <tr class="hover:bg-[color:var(--color-border)]/30 transition">
            <td class="py-2 px-3 font-medium">00926 中信電池及儲能</td>
            <td class="text-right py-2 px-3">8.7%</td>
            <td class="text-right py-2 px-3">$17.2</td>
            <td class="text-right py-2 px-3">$16.4</td>
            <td class="text-right py-2 px-3 text-[color:var(--color-line2)]">+4.9%</td>
            <td class="text-right py-2 px-3">$108,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
