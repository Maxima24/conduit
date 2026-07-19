import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** DLQ bulk-replay selection — pure UI intent (never holds server data). */
interface SelectionState {
  selectedSendIds: string[];
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
}

export const useSelectionStore = create<SelectionState>()(
  devtools((set, get) => ({
    selectedSendIds: [],
    toggle: (id) =>
      set((s) => ({
        selectedSendIds: s.selectedSendIds.includes(id)
          ? s.selectedSendIds.filter((x) => x !== id)
          : [...s.selectedSendIds, id],
      })),
    clear: () => set({ selectedSendIds: [] }),
    isSelected: (id) => get().selectedSendIds.includes(id),
  })),
);
