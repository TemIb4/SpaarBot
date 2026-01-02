import { useState } from 'react'
import { api } from '../lib/api'

interface Transaction {
  id: number
  telegram_id: number
  amount: number
  description: string
  category?: string
  type: 'expense' | 'income'  // ✅ ИЗМЕНЕНО
  date: string  // ✅ ИЗМЕНЕНО
  created_at: string
}

export const useTransactions = (telegram_id: number) => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  const fetchTransactions = async (startDate?: string, endDate?: string) => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/transactions/', {
        params: { telegram_id, start_date: startDate, end_date: endDate }
      })
      setTransactions(response.data)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (data: Partial<Transaction>) => {
    try {
      await api.post('/api/v1/transactions/', data)
      await fetchTransactions()
    } catch (error) {
      throw error
    }
  }

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')  // ✅ ИСПРАВЛЕНО
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')  // ✅ ИСПРАВЛЕНО
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    totalExpenses,
    totalIncome
  }
}