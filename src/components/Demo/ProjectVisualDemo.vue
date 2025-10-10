<template>
  <div class="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
    <!-- Header -->
    <header class="flex items-center justify-between px-6 py-3 bg-white shadow">
      <div class="flex items-center space-x-2">
        <div class="text-xl font-bold text-blue-600">📊 My Stock Map</div>
      </div>
      <div class="flex items-center space-x-4">
        <input
          type="text"
          placeholder="搜尋股票..."
          class="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring focus:ring-blue-200"
        />
        <button class="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600">登入</button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Left Sidebar -->
      <aside class="w-60 bg-white border-r p-4 space-y-2 hidden md:block">
        <nav class="flex flex-col space-y-2">
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50 font-medium">🏠 Dashboard</button>
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50">💼 Portfolio</button>
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50">📈 Stock Detail</button>
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50">🔍 Backtest</button>
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50">📊 Reports</button>
          <button class="text-left px-3 py-2 rounded-lg hover:bg-blue-50">⚙️ Settings</button>
        </nav>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-6 space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl shadow p-4">
            <h3 class="text-sm text-gray-500">總市值</h3>
            <p class="text-2xl font-bold mt-2">$1,245,300</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <h3 class="text-sm text-gray-500">今日損益</h3>
            <p class="text-2xl font-bold mt-2 text-green-600">+2.4%</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <h3 class="text-sm text-gray-500">近 7 日漲跌</h3>
            <p class="text-2xl font-bold mt-2 text-red-600">-1.2%</p>
          </div>
          <div class="bg-white rounded-2xl shadow p-4">
            <h3 class="text-sm text-gray-500">現金部位</h3>
            <p class="text-2xl font-bold mt-2">23%</p>
          </div>
        </div>

        <!-- Middle Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Pie Chart + Table -->
          <div class="lg:col-span-1 bg-white rounded-2xl shadow p-4 space-y-4">
            <div class="h-48 flex items-center justify-center text-gray-400">[持股比例圖 / 環形圖]</div>
            <div class="border-t pt-3">
              <table class="w-full text-sm">
                <thead class="text-gray-500">
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
          <div class="lg:col-span-2 bg-white rounded-2xl shadow p-4">
            <div class="h-72 flex items-center justify-center text-gray-400">[市值 / 損益趨勢圖]</div>
          </div>
        </div>

        <!-- Bottom: Timeline / Notes -->
        <div class="bg-white rounded-2xl shadow p-4">
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
// 無邏輯，純視覺 Wireframe
</script>
