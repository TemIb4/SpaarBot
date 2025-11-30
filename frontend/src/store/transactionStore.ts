import { create } from 'zustand'
import type { Transaction } from '@/types'
import { api } from '@/lib/api'

interface TransactionStore {
  transactions: Transaction[]
  loading: boolean
  error: string | null

  fetchTransactions: (startDate?: string, endDate?: string) => Promise<void>
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at'>) => Promise<void>
  deleteTransaction: (id: number) => Promise<void>
}

// Get Telegram user ID
const getTelegramId = (): number => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user) {
    return window.Telegram.WebApp.initDataUnsafe.user.id
  }
  return 0 // Fallback for development
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  transactions: [],
  loading: false,
  error: null,

  fetchTransactions: async (startDate?: string, endDate?: string) => {
    set({ loading: true, error: null })
    try {
      const telegram_id = getTelegramId()

      if (!telegram_id) {
        throw new Error('Telegram ID not found')
      }

      const params: Record<string, string | number> = {
        telegram_id,
        limit: 1000
      }

      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await api.get<Transaction[]>('/api/v1/transactions/', {
        params
      })

      if (response.data) {
        set({ transactions: response.data, loading: false })
      } else {
        // Fallback to empty if API unavailable
        set({ transactions: [], loading: false })
      }

    } catch (error: any) {
      console.error('Error fetching transactions:', error)
      set({
        error: error.message || 'Failed to fetch transactions',
        loading: false,
        transactions: [] // Empty array on error
      })
    }
  },

  addTransaction: async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    set({ loading: true, error: null })
    try {
      const response = await api.post<Transaction>('/api/v1/transactions/', transaction)

      if (response.data) {
        // Add to local state
        set((state) => ({
          transactions: [response.data, ...state.transactions],
          loading: false
        }))
      }

    } catch (error: any) {
      console.error('Error adding transaction:', error)
      set({
        error: error.message || 'Failed to add transaction',
        loading: false
      })
      throw error
    }
  },

  deleteTransaction: async (id: number) => {
    set({ loading: true, error: null })
    try {
      const telegram_id = getTelegramId()

      await api.delete(`/api/v1/transactions/${id}`, {
        params: { telegram_id }
      })

      // Remove from local state
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        loading: false,
      }))

    } catch (error: any) {
      console.error('Error deleting transaction:', error)
      set({
        error: error.message || 'Failed to delete transaction',
        loading: false
      })
      throw error
    }
  },
}))