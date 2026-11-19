import { addDays, todayString } from '@pomobox/core'
import { createStore, useStore } from 'zustand'

export type Editing =
  | { kind: 'new'; date: string; startMin: number }
  | { kind: 'existing'; date: string; blockId: string }
  | null

type UiState = {
  selectedDate: string
  followToday: boolean
  editing: Editing
  moveDays: (amount: number, today: string) => void
  goToday: (today: string) => void
  syncToday: (today: string) => void
  openNew: (startMin: number) => void
  openExisting: (blockId: string) => void
  closeEditor: () => void
}

export function createUiStore(today: string) {
  return createStore<UiState>((set, get) => ({
    selectedDate: today,
    followToday: true,
    editing: null,
    moveDays: (amount, todayDate) => {
      const next = addDays(get().selectedDate, amount)
      set({ selectedDate: next, followToday: next === todayDate })
    },
    goToday: (todayDate) => set({ selectedDate: todayDate, followToday: true }),
    syncToday: (todayDate) => {
      if (get().followToday && get().selectedDate !== todayDate) set({ selectedDate: todayDate })
    },
    openNew: (startMin) => set({ editing: { kind: 'new', date: get().selectedDate, startMin } }),
    openExisting: (blockId) => set({ editing: { kind: 'existing', date: get().selectedDate, blockId } }),
    closeEditor: () => set({ editing: null }),
  }))
}

export const uiStore = createUiStore(todayString(new Date()))

export function useUiStore<T>(selector: (state: UiState) => T): T {
  return useStore(uiStore, selector)
}
