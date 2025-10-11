<template>
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
            <td class="text-right">12.2%</td>
          </tr>
          <tr>
            <td>00675L</td>
            <td class="text-right">31.4%</td>
          </tr>
          <tr>
            <td>006208</td>
            <td class="text-right">41.5%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
