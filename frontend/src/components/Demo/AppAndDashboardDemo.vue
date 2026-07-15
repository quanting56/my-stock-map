<template>
  <div
    :data-theme="isDark ? 'dark' : 'light'"
    class="min-h-screen bg-theme text-theme flex flex-col transition-colors duration-500"
  >
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-3 card-theme border-b">
      <div class="flex items-center space-x-2">
        <div class="text-xl font-bold text-[color:var(--color-primary)]">
          📊 My Stock Map
        </div>
      </div>
      
      <div class="flex items-center space-x-4">
        <input
          type="text"
          placeholder="搜尋股票..."
          class="px-3 py-1 border rounded-lg text-sm bg-[color:var(--color-card)] text-[color:var(--color-text)] border-[color:var(--color-border)] focus:outline-none focus:ring focus:ring-[color:var(--color-primary)]/30"
        />
        <button
          @click="isDark = !isDark"
          class="px-3 py-1 text-sm rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-card)] hover:bg-[color:var(--color-border)] transition"
        >
          {{ isDark ? '🌞 日間模式' : '🌙 夜間模式' }}
        </button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-60 card-theme border-r p-4 space-y-2 hidden md:block">
        <nav class="flex flex-col space-y-2">
          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition font-medium">
            🏠 Dashboard
          </button>

          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition">
            💼 Portfolio
          </button>

          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition">
            📈 Stock Detail
          </button>

          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition">
            🔍 Backtest
          </button>
          
          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition">
            📊 Reports
          </button>
          
          <button class="text-left px-3 py-2 rounded-lg hover:bg-[color:var(--color-border)] transition">
            ⚙️ Settings
          </button>
        </nav>
      </aside>
      
      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card-theme rounded-2xl shadow p-4 text-center">
            <h3 class="text-sm text-[color:var(--color-secondary)]">
              總市值
            </h3>
            <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">
              $1,245,300
            </p>
          </div>
          
          <div class="card-theme rounded-2xl shadow p-4 text-center">
            <h3 class="text-sm text-[color:var(--color-secondary)]">
              今日損益
            </h3>
            <p class="text-2xl font-bold mt-2 text-[color:var(--color-line2)]">
              +2.4%
            </p>
          </div>
          
          <div class="card-theme rounded-2xl shadow p-4 text-center">
            <h3 class="text-sm text-[color:var(--color-secondary)]">
              近 7 日漲跌
            </h3>
            <p class="text-2xl font-bold mt-2 text-[color:var(--color-line3)]">
              -1.2%
            </p>
          </div>
          
          <div class="card-theme rounded-2xl shadow p-4 text-center">
            <h3 class="text-sm text-[color:var(--color-secondary)]">
              現金部位
            </h3>
            <p class="text-2xl font-bold mt-2 text-[color:var(--color-primary)]">
              23%
            </p>
          </div>
        </div>
        
        <!-- Middle Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Pie Chart + Table -->
          <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4 space-y-4">
            <div class="h-48 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
              [持股比例圖 / 環形圖]
            </div>
            <div class="border-t border-[color:var(--color-border)] pt-3">
              <table class="w-full text-sm">
                <thead class="text-[color:var(--color-secondary)]">
                  <tr>
                    <th class="text-left">股票</th>
                    <th class="text-right">比例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>台積電</td>
                    <td class="text-right">41.5%</td>
                  </tr>
                  <tr>
                    <td>00675L</td>
                    <td class="text-right">31.4%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Right: Time Series Chart -->
          <div class="lg:col-span-2 card-theme rounded-2xl shadow p-4 flex items-center justify-center text-[color:var(--color-secondary)] opacity-70">
            [市值 / 損益趨勢圖]
          </div>
        </div>
        
        <!-- Bottom: Timeline / Notes -->
        <div class="card-theme rounded-2xl shadow p-4">
          <h3 class="font-medium mb-2">📅 最近事件</h3>
          <ul class="space-y-2 text-sm">
            <li>2025-10-07：加碼 00675L $5,000</li>
            <li>2025-10-05：台積電配息入帳 $1,200</li>
          </ul>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
const isDark = ref(false);
</script>