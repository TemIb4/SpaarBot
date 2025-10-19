/**
 * Transaction store - Zustand
 */
import { create } from 'zustand'
import type { Transaction, Category, CategoryBreakdown } from '@/types'

interface TransactionState {
  transactions: Transaction[]
  categories: Category[]
  categoryBreakdown: CategoryBreakdown[]
  isLoading: boolean
  error: string | null

  setTransactions: (transactions: Transaction[]) => void
  addTransaction: (transaction: Transaction) => void
  setCategories: (categories: Category[]) => void
  setCategoryBreakdown: (breakdown: CategoryBreakdown[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearTransactions: () => void
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  categories: [],
  categoryBreakdown: [],
  isLoading: false,
  error: null,

  setTransactions: (transactions) => set({ transactions, error: null }),

  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),

  setCategories: (categories) => set({ categories }),

  setCategoryBreakdown: (categoryBreakdown) => set({ categoryBreakdown }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  clearTransactions: () =>
    set({ transactions: [], categoryBreakdown: [], error: null }),
}))