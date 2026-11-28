<template>
  <Teleport to="body">
    <!-- 全域 Loading 覆蓋層 -->
    <div
      v-if="props.isOpen"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="fixed inset-0 z-999 flex flex-col items-center justify-center bg-black/50 px-6"
    >
      <!-- Spinner -->
      <div
        aria-hidden="true"
        class="size-14 rounded-full border-10 border-foreground-subtle/50 border-t-brand motion-safe:animate-spin"
      ></div>

      <!-- Loading message -->
      <p class="mt-6 text-center text-white">{{ props.message }}，請稍候…</p>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    message?: string;
  }>(),
  {
    isOpen: false,
    message: "資料處理中",
  },
);
</script>

<style scoped></style>
