<template>
  <div class="p-6 space-y-6">
    <!-- 頁面標題 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-[color:var(--color-primary)]">💼 我的投資組合</h2>
      <button
        class="px-4 py-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] transition text-sm"
      >
        ➕ 新增投資
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">總市值</h3>
        <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">$1,245,300</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">總成本</h3>
        <p class="text-2xl font-bold mt-2 text-[color:var(--color-line3)]">$1,050,000</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">含息報酬率</h3>
        <p class="text-2xl font-bold mt-2 text-[color:var(--color-line2)]">+18.6%</p>
      </div>
      <div class="card-theme rounded-2xl shadow p-4 text-center">
        <h3 class="text-sm text-[color:var(--color-secondary)]">現金比例</h3>
        <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">23%</p>
      </div>
    </div>

    <!-- Middle Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: 投資分布圖 -->
      <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">📊 投資分布（現金、持股、融資等比例）</h3>
        <div class="h-56 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          [圓餅圖 / 環形圖預留區]
        </div>
      </div>

      <!-- Right: 淨值變化折線圖 -->
      <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4">
        <h3 class="font-medium mb-3">📈 淨值變化</h3>
        <div class="h-56 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
          [市值趨勢圖預留區]
        </div>
      </div>
    </div>

    <!-- Bottom Section: 持股明細表 -->
    <div class="card-theme rounded-2xl shadow p-4">
      <h3 class="font-medium mb-3">📋 持股明細</h3>
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

    <!-- Footer Notes -->
    <div class="text-xs text-[color:var(--color-secondary)] text-right">
      資料為示意用途，實際數據請以最新持股紀錄為準。
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
