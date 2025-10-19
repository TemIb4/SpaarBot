/**
 * UI Store
 */
import { create } from 'zustand'

interface DateRange {
  start: string
  end: string
}

interface UIStore {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  isAddingTransaction: boolean
  setIsAddingTransaction: (value: boolean) => void
}

const getDefaultDateRange = (): DateRange => {
  const end = new Date()
  const start = new Date()
  start.setDate(1) // Начало месяца

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}

export const useUIStore = create<UIStore>((set) => ({
  dateRange: getDefaultDateRange(),
  setDateRange: (range) => set({ dateRange: range }), // ✅ Принимает только объект
  isAddingTransaction: false,
  setIsAddingTransaction: (value) => set({ isAddingTransaction: value }),
}))