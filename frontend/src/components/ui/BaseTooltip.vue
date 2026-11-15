<template>
  <Teleport to="body">
    <div
      v-show="props.isOpen"
      class="pointer-events-none fixed top-0 left-0 z-50"
      :style="{
        transform: `translate3d(${props.x}px, ${props.y}px, 0)`,
      }"
    >
      <div
        ref="tooltipRef"
        role="tooltip"
        class="max-w-72 min-w-24 rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground shadow-lg"
        :class="[
          isPositionReady ? 'visible' : 'invisible',
          shouldAnimatePosition
            ? 'transition-transform duration-100 ease-out motion-reduce:transition-none'
            : 'transition-none',
        ]"
        :style="{
          transform: `translate3d(${floatingOffset.x}px, ${floatingOffset.y}px, 0)`,
        }"
      >
        <slot></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

import { usePointerFloatingPosition } from "@/composables/usePointerFloatingPosition";

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    x: number;
    y: number;
    placementKey?: string | number | null;
    offset?: number;
    viewportGutter?: number;
  }>(),
  {
    placementKey: null,
    offset: 12,
    viewportGutter: 12,
  },
);

const tooltipRef = ref<HTMLDivElement | null>(null);
const shouldAnimatePosition = ref(false);

let firstFrameId: number | null = null;
let secondFrameId: number | null = null;

const {
  offset: floatingOffset,
  isPositionReady,
  updateFromPoint,
  resetPosition,
} = usePointerFloatingPosition(tooltipRef);

function cancelTransitionFrames(): void {
  if (firstFrameId !== null) {
    cancelAnimationFrame(firstFrameId);
    firstFrameId = null;
  }

  if (secondFrameId !== null) {
    cancelAnimationFrame(secondFrameId);
    secondFrameId = null;
  }
}

function enablePositionTransitionAfterPaint(): void {
  cancelTransitionFrames();

  firstFrameId = requestAnimationFrame(() => {
    firstFrameId = null;

    secondFrameId = requestAnimationFrame(() => {
      secondFrameId = null;

      if (props.isOpen && isPositionReady.value) {
        shouldAnimatePosition.value = true;
      }
    });
  });
}

function updatePosition(): void {
  if (!props.isOpen) {
    return;
  }

  const isInitialPosition = !isPositionReady.value;

  if (isInitialPosition) {
    shouldAnimatePosition.value = false;
  }

  updateFromPoint(
    {
      x: props.x,
      y: props.y,
    },
    {
      offset: props.offset,
      viewportGutter: props.viewportGutter,
    },
  );

  if (isInitialPosition) {
    enablePositionTransitionAfterPaint();
  }
}

watch(
  () => props.isOpen,
  (isOpen) => {
    if (!isOpen) {
      cancelTransitionFrames();
      shouldAnimatePosition.value = false;
      resetPosition();
    }
  },
  {
    flush: "sync",
  },
);

watch(
  () => props.placementKey,
  (placementKey, previousPlacementKey) => {
    if (props.isOpen && placementKey !== previousPlacementKey) {
      cancelTransitionFrames();
      shouldAnimatePosition.value = false;
      resetPosition();
    }
  },
  {
    flush: "sync",
  },
);

watch(
  () => [props.isOpen, props.x, props.y] as const,
  () => {
    updatePosition();
  },
  {
    flush: "post",
  },
);

onMounted(() => {
  updatePosition();
});

onBeforeUnmount(() => {
  cancelTransitionFrames();
});
</script>

<style scoped></style>
