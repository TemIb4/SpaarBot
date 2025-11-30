/**
 * UI Store
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DateRange {
  start: string
  end: string
}

interface UIStore {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
  isAddingTransaction: boolean
  setIsAddingTransaction: (value: boolean) => void
  animatedBackground: boolean
  setAnimatedBackground: (value: boolean) => void
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

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      dateRange: getDefaultDateRange(),
      setDateRange: (range) => set({ dateRange: range }),
      isAddingTransaction: false,
      setIsAddingTransaction: (value) => set({ isAddingTransaction: value }),
      animatedBackground: true, // ВСЕГДА ВКЛЮЧЕНО ПО УМОЛЧАНИЮ!
      setAnimatedBackground: (value) => {
        console.log('🎨 AnimatedBackground toggled:', value)
        set({ animatedBackground: value })
      },
    }),
    {
      name: 'spaarbot-ui-storage',
      version: 1, // Увеличиваем версию чтобы сбросить старые настройки
    }
  )
)