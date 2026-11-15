import { ref, type Ref } from "vue";

interface FloatingPoint {
  x: number;
  y: number;
}

interface FloatingOffset {
  x: number;
  y: number;
}

type HorizontalPlacement = "left" | "right";
type VerticalPlacement = "top" | "bottom";

interface FloatingPlacement {
  horizontal: HorizontalPlacement;
  vertical: VerticalPlacement;
}

interface PointerFloatingPositionOptions {
  offset?: number;
  viewportGutter?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function usePointerFloatingPosition(floatingRef: Ref<HTMLElement | null>) {
  const offset = ref<FloatingOffset>({
    x: 0,
    y: 0,
  });

  const placement = ref<FloatingPlacement>({
    horizontal: "right",
    vertical: "bottom",
  });

  const isPositionReady = ref(false);

  function updateFromPoint(
    point: FloatingPoint,
    { offset: gap = 12, viewportGutter = 12 }: PointerFloatingPositionOptions = {},
  ): void {
    const floatingElement = floatingRef.value;

    if (!floatingElement || typeof window === "undefined") {
      return;
    }

    const floatingRect = floatingElement.getBoundingClientRect();

    const requiredWidth = floatingRect.width + gap;
    const requiredHeight = floatingRect.height + gap;

    const availableRight = window.innerWidth - viewportGutter - point.x;
    const availableLeft = point.x - viewportGutter;
    const availableBottom = window.innerHeight - viewportGutter - point.y;
    const availableTop = point.y - viewportGutter;

    // 每個 tooltip target 首次顯示時決定 placement
    // 同一 target 後續 pointer move 只更新座標，不再左右 / 上下翻面
    if (!isPositionReady.value) {
      let horizontal: HorizontalPlacement;
      let vertical: VerticalPlacement;

      if (availableRight >= requiredWidth) {
        horizontal = "right";
      } else if (availableLeft >= requiredWidth) {
        horizontal = "left";
      } else {
        horizontal = availableRight >= availableLeft ? "right" : "left";
      }

      if (availableBottom >= requiredHeight) {
        vertical = "bottom";
      } else if (availableTop >= requiredHeight) {
        vertical = "top";
      } else {
        vertical = availableBottom >= availableTop ? "bottom" : "top";
      }

      placement.value = {
        horizontal,
        vertical,
      };

      isPositionReady.value = true;
    }

    const { horizontal, vertical } = placement.value;

    let viewportX = horizontal === "right" ? point.x + gap : point.x - floatingRect.width - gap;
    let viewportY = vertical === "bottom" ? point.y + gap : point.y - floatingRect.height - gap;

    const maxX = Math.max(viewportGutter, window.innerWidth - viewportGutter - floatingRect.width);
    const maxY = Math.max(
      viewportGutter,
      window.innerHeight - viewportGutter - floatingRect.height,
    );

    viewportX = clamp(viewportX, viewportGutter, maxX);
    viewportY = clamp(viewportY, viewportGutter, maxY);

    offset.value = {
      x: viewportX - point.x,
      y: viewportY - point.y,
    };
  }

  function resetPosition(): void {
    offset.value = {
      x: 0,
      y: 0,
    };

    placement.value = {
      horizontal: "right",
      vertical: "bottom",
    };

    isPositionReady.value = false;
  }

  return {
    offset,
    isPositionReady,
    updateFromPoint,
    resetPosition,
  };
}
