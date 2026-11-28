import { computed, ref } from "vue";
import { defineStore } from "pinia";

interface LoadingTask {
  id: number;
  message: string;
}

export const useGlobalLoadingStore = defineStore("globalLoading", () => {
  const tasks = ref<LoadingTask[]>([]);

  let nextTaskId = 0;

  const isOpen = computed(() => tasks.value.length > 0);

  // 多個任務同時執行時，顯示最後開始的任務訊息
  const message = computed(() => tasks.value.at(-1)?.message ?? "資料處理中");

  /** 登記一筆全域 Loading 任務，回傳該任務的 ID。 */
  function start(message = "資料處理中"): number {
    const id = ++nextTaskId;

    tasks.value.push({
      id,
      message,
    });

    return id;
  }

  /** 結束指定 Loading 任務，不影響其他尚未完成的任務。 */
  function finish(id: number): void {
    tasks.value = tasks.value.filter((task) => task.id !== id);
  }

  return {
    isOpen,
    message,
    start,
    finish,
  };
});
