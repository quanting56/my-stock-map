<template>
  <svg
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="My Stock Map 標誌"
    class="block h-full w-full"
  >
    <!-- 背景 -->
    <circle
      v-if="props.background === 'circle'"
      cx="100"
      cy="100"
      r="100"
      class="fill-surface"
    />

    <rect
      v-else-if="props.background === 'square'"
      x="0"
      y="0"
      width="200"
      height="200"
      class="fill-surface"
    />

    <!-- 7 道光芒：底邊在半徑 45（= 圓周外 10px），底邊平行切線，尖端在半徑 70 -->
    <polygon
      points="145.0,106.0 145.0,94.0 170.0,100.0"
      fill="#fdba74"
    />
    <polygon
      points="142.0, 82.7 136.0,72.3 160.6, 65.0"
      fill="#fdba74"
    />
    <polygon
      points="127.7, 64.0 117.3,58.0 135.0, 39.4"
      fill="#fdba74"
    />
    <polygon
      points="106.0, 55.0 94.0,55.0  100.0, 30.0"
      fill="#fdba74"
    />
    <polygon
      points=" 82.7, 58.0 72.3,64.0   65.0, 39.4"
      fill="#fdba74"
    />
    <polygon
      points=" 64.0, 72.3 58.0,82.7   39.4, 65.0"
      fill="#fdba74"
    />
    <polygon
      points=" 55.0, 94.0 55.0,106.0  30.0,100.0"
      fill="#fdba74"
    />

    <!-- 半圓太陽（半徑 30） -->
    <!-- 圓心 (100,100)，左右端點分別是 (70,100) 和 (130,100) -->
    <path
      d="M70 100 A30 30 0 0 1 130 100"
      fill="none"
      stroke="#f97316"
      stroke-width="8"
      stroke-linecap="round"
    />

    <!-- 水面三條橢圓 -->
    <ellipse
      cx="100"
      cy="120"
      rx="70"
      ry="7"
      fill="#2563eb"
      opacity="0.7"
    />
    <ellipse
      cx="100"
      cy="140"
      rx="55"
      ry="7"
      fill="#2563eb"
      opacity="0.85"
    />
    <ellipse
      cx="100"
      cy="160"
      rx="40"
      ry="7"
      fill="#2563eb"
      opacity="1"
    />
  </svg>
</template>

<script setup lang="ts">
type LogoBackground = "transparent" | "circle" | "square";

const props = withDefaults(
  defineProps<{
    background?: LogoBackground;
  }>(),
  {
    background: "transparent",
  },
);
</script>

<style scoped></style>
