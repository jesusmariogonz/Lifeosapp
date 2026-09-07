import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrioritiesState {
  byDate: Record<string, string[]>; // date -> taskIds (max 3)
  togglePriority: (date: string, taskId: string) => void;
  getPriorities: (date: string) => string[];
}

export const usePrioritiesStore = create<PrioritiesState>()(
  persist(
    (set, get) => ({
      byDate: {},
      togglePriority: (date, taskId) => {
        const current = get().byDate[date] || [];
        let next: string[];
        if (current.includes(taskId)) {
          next = current.filter((id) => id !== taskId);
        } else if (current.length < 3) {
          next = [...current, taskId];
        } else {
          next = current;
        }
        set({ byDate: { ...get().byDate, [date]: next } });
      },
      getPriorities: (date) => get().byDate[date] || [],
    }),
    { name: "life-os-priorities" }
  )
);
