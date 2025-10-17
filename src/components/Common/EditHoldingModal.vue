<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/40" @click="$emit('close')"></div>

    <div class="relative bg-[color:var(--color-card)] text-[color:var(--color-text)] rounded-lg shadow-lg w-[min(90%,640px)] p-6 z-10">
      <h3 class="text-lg font-semibold mb-4">{{ editMode === "edit" ? "編輯持股" : "新增持股" }}</h3>

      <form @submit.prevent="save">
        <div class="grid grid-cols-1 gap-3">
          <label>
            <div class="text-sm text-[color:var(--color-secondary)]">股票代碼 (id)</div>
            <input v-model="form.id" required class="w-full border p-2 rounded" />
          </label>

          <label>
            <div class="text-sm text-[color:var(--color-secondary)]">股票名稱</div>
            <input v-model="form.name" class="w-full border p-2 rounded" />
          </label>

          <label class="grid grid-cols-3 gap-2">
            <div>
              <div class="text-sm text-[color:var(--color-secondary)]">張數 / 股數</div>
              <input v-model.number="form.shares" type="number" min="0" class="w-full border p-2 rounded" />
            </div>
            <div>
              <div class="text-sm text-[color:var(--color-secondary)]">當前價格</div>
              <input v-model.number="form.price" type="number" step="0.01" class="w-full border p-2 rounded" />
            </div>
            <div>
              <div class="text-sm text-[color:var(--color-secondary)]">成本 (每股)</div>
              <input v-model.number="form.cost" type="number" step="0.01" class="w-full border p-2 rounded" />
            </div>
          </label>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" @click="$emit('close')" class="px-4 py-2 rounded border cursor-pointer">取消</button>
            <button type="submit" class="px-4 py-2 rounded bg-[color:var(--color-primary)] text-white cursor-pointer">儲存</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({
  editMode: {
    type: String,
    default: "add",
  },
  form: {
    type: Object,
    required: true,
  }
});

defineEmits(["close", "save"]);
</script>

<style scoped></style>
