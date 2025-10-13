<template>
  <div class="lg:col-span-1 card-theme rounded-2xl shadow p-4 overflow-auto">
    <div class="flex items-center justify-between mb-3">
      <h3 class="font-medium text-[color:var(--color-secondary)]">資產分布</h3>
    </div>

    <div class="flex items-center gap-4">
      <!-- donut svg -->
      <div class="w-36 h-36 flex items-center justify-center">
        <svg viewBox="0 0 42 42" class="w-36 h-36">
          <defs></defs>
          <g transform="rotate(-90 21 21)">
            <circle cx="21" cy="21" r="15.9" fill="transparent" stroke="rgba(0,0,0,0.04)" stroke-width="10"></circle>
          </g>
          <!-- center text -->
          <text x="21" y="20" text-anchor="middle" alignment-baseline="middle" class="fill-[color:var(--color-secondary)]" style="font-size: 8px; fill: var(--color-secondary);">
            持倉
          </text>
          <text x="21" y="27" text-anchor="middle" alignment-baseline="middle" class="fill-[color:var(--color-secondary)]" style="font-size: 3px; fill: var(--color-secondary);">
            共 73,060 元
          </text>
        </svg>
      </div>

      <!-- legend -->
      <div class="flex-1">
        <ul class="space-y-2 text-sm">
          <li class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-sm" style="backgroundColor: #123456;"></span>
              <div>
                <div class="font-medium">TSM</div>
                <div class="text-xs text-[color:var(--color-secondary)]">台積電</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-[color:var(--color-primary)]">$321,322</div>
              <div class="text-xs text-[color:var(--color-secondary)]">33.8%</div>
            </div>
          </li>
          <li class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-sm" style="backgroundColor: #789abc;"></span>
              <div>
                <div class="font-medium">00675L</div>
                <div class="text-xs text-[color:var(--color-secondary)]">元大台灣加權正二</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-[color:var(--color-primary)]">$532,212</div>
              <div class="text-xs text-[color:var(--color-secondary)]">53.6%</div>
            </div>
          </li>
          <li class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span class="w-3 h-3 rounded-sm" style="backgroundColor: #123456;"></span>
              <div>
                <div class="font-medium">2498.TW</div>
                <div class="text-xs text-[color:var(--color-secondary)]">宏達電</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-medium text-[color:var(--color-primary)]">$32,331</div>
              <div class="text-xs text-[color:var(--color-secondary)]">32.9%</div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup></script>

<style scoped></style>
