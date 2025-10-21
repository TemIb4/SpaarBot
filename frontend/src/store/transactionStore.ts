import { create } from 'zustand'
import type { Transaction } from '@/types'

interface TransactionStore {
  transactions: Transaction[]
  loading: boolean
  error: string | null
  
  fetchTransactions: (startDate?: string, endDate?: string) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (_startDate?: string, _endDate?: string) => {  // ✅ Префикс _ для неиспользуемых параметров
    set({ loading: true, error: null })
    try {
      // Mock data for now
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          telegram_id: 123456789,
          amount: 45.50,
          description: 'Rewe Einkauf',
          category: 'food',
          type: 'expense',
          date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          telegram_id: 123456789,
          amount: 2500.00,
          description: 'Gehalt',
          category: 'salary',
          type: 'income',
          date: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ]
      set({ transactions: mockTransactions, loading: false })
    } catch (error) {
      set({ error: 'Failed to fetch transactions', loading: false })
    }
  },

  addTransaction: async (_transaction: Omit<Transaction, 'id' | 'created_at'>) => {  // ✅ Префикс _
    set({ loading: true, error: null })
    try {
      // TODO: API call here
      // const response = await api.post('/transactions', transaction)
      set({ loading: false })
    } catch (error) {
      set({ error: 'Failed to add transaction', loading: false })
    }
  },

  deleteTransaction: async (id: number) => {
    set({ loading: true, error: null })
    try {
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        loading: false,
      }))
    } catch (error) {
      set({ error: 'Failed to delete transaction', loading: false })
    }
  },
}))