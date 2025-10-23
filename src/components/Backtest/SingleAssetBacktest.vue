<template>
  <!-- 參數設定區 -->
  <div class="card-theme rounded-2xl shadow p-6 space-y-4">
    <h3 class="font-medium">⚙️ 回測參數設定</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">股票代號</label>
        <input
          type="text"
          placeholder="例如：2330"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">起始日期</label>
        <input
          type="date"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">結束日期</label>
        <input
          type="date"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">初始資金</label>
        <input
          type="number"
          placeholder="例如：100000"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">策略選擇</label>
        <select
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        >
          <option>定期定額</option>
          <option>均線交叉</option>
          <option>RSI 超買超賣</option>
          <option>自訂策略</option>
        </select>
      </div>
      <div>
        <label class="text-sm text-[color:var(--color-secondary)] block mb-1">每次投入金額</label>
        <input
          type="number"
          placeholder="例如：5000"
          class="w-full px-3 py-2 rounded-lg bg-[color:var(--color-card)] border border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
      </div>
    </div>
    <div class="pt-2 flex justify-end">
      <button
        class="px-4 py-2 rounded-lg bg-[color:var(--color-primary)] text-white hover:brightness-95 transition">
        ▶️ 開始回測
      </button>
    </div>
  </div>

  <!-- 走勢圖 + 總資產變化 -->
  <div class="card-theme rounded-2xl shadow p-6 relative">  <!-- 🟢 加 relative 才能放 overlay -->
    <h3 class="font-medium mb-3">📈 資產變化走勢</h3>
  
    <div class="h-72 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
      [回測模擬曲線圖區域]
    </div>
  
    <!-- 🟢 新增：KPI 面板（圖內右下角） -->
    <div
      class="absolute bottom-3 right-3 pointer-events-none"
      aria-label="回測摘要指標"
    >
      <div
        class="pointer-events-auto
               px-3 py-2 rounded-xl border border-[color:var(--color-border)]
               bg-[color:var(--color-card)]/85 backdrop-blur
               shadow-sm"
      >
        <!-- 容器：桌面 2×2；小螢幕變橫向 chips -->
        <div class="hidden md:grid grid-cols-2 gap-2">
          <!-- chip 1 -->
          <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5">
            <span class="text-xs text-[color:var(--color-secondary)]">總報酬率</span>
            <span class="text-sm font-semibold text-[color:var(--color-line2)]">+12.7%</span>
          </div>
          <!-- chip 2 -->
          <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5">
            <span class="text-xs text-[color:var(--color-secondary)]">最大回撤</span>
            <span class="text-sm font-semibold text-[color:var(--color-line3)]">-8.9%</span>
          </div>
          <!-- chip 3 -->
          <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5">
            <span class="text-xs text-[color:var(--color-secondary)]">年化報酬</span>
            <span class="text-sm font-semibold text-[color:var(--color-primary)]">6.3%</span>
          </div>
          <!-- chip 4 -->
          <div class="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/5">
            <span class="text-xs text-[color:var(--color-secondary)]">勝率</span>
            <span class="text-sm font-semibold text-[color:var(--color-primary)]">61%</span>
          </div>
        </div>
      
        <!-- 行動裝置：1×4 橫向捲動 chips -->
        <div class="md:hidden flex gap-2 overflow-x-auto max-w-[80vw] py-1">
          <div class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg border border-[color:var(--color-border)]">
            <span class="text-xs text-[color:var(--color-secondary)]">報酬</span>
            <span class="text-sm font-semibold text-[color:var(--color-line2)]">+12.7%</span>
          </div>
          <div class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg border border-[color:var(--color-border)]">
            <span class="text-xs text-[color:var(--color-secondary)]">回撤</span>
            <span class="text-sm font-semibold text-[color:var(--color-line3)]">-8.9%</span>
          </div>
          <div class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg border border-[color:var(--color-border)]">
            <span class="text-xs text-[color:var(--color-secondary)]">年化</span>
            <span class="text-sm font-semibold text-[color:var(--color-primary)]">6.3%</span>
          </div>
          <div class="shrink-0 flex items-center gap-2 px-2 py-1 rounded-lg border border-[color:var(--color-border)]">
            <span class="text-xs text-[color:var(--color-secondary)]">勝率</span>
            <span class="text-sm font-semibold text-[color:var(--color-primary)]">61%</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
