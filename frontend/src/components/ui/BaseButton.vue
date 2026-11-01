<template>
  <button
    :type="props.type"
    class="cursor-pointer rounded-lg border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
    :class="variantClasses[props.variant]"
  >
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
type ButtonVariant = "primary" | "secondary";
type ButtonType = "button" | "submit" | "reset";

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant;
    type?: ButtonType;
  }>(),
  {
    variant: "primary",
    type: "button",
  },
);

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-action text-action-foreground hover:bg-action-hover active:outline-2 active:outline-offset-2 active:outline-action",
  secondary: "border-border bg-surface text-foreground hover:bg-surface-hover active:border-action",
};
</script>

<style scoped></style>
