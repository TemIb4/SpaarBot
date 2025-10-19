/**
 * Transactions hook
 */
import { useQuery } from '@tanstack/react-query'
import { useTelegram } from './useTelegram'
import { useUIStore } from '@/store/uiStore'
import { api } from '@/lib/api'
import type { Transaction, Category } from '@/types' // ✅ Изменили путь

interface CategoryBreakdown {
  name: string
  icon: string
  color: string
  total: number
}

export const useTransactions = () => {
  const { user } = useTelegram()
  const { dateRange } = useUIStore()

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!user?.id) return []

      const params = new URLSearchParams({
        telegram_id: user.id.toString(),
        start_date: dateRange.start,
        end_date: dateRange.end,
      })

      const response = await api.get(`/transactions/?${params}`)
      return response.data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  })

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const response = await api.get(`/twa/data/categories?telegram_id=${user.id}`)
      return response.data
    },
    enabled: !!user?.id,
    staleTime: Infinity,
  })

  const { data: categoryBreakdown = [] } = useQuery<CategoryBreakdown[]>({
    queryKey: ['category-breakdown', user?.id, dateRange.start, dateRange.end],
    queryFn: async () => {
      if (!user?.id) return []

      const params = new URLSearchParams({
        telegram_id: user.id.toString(),
        start_date: dateRange.start,
        end_date: dateRange.end,
      })

      const response = await api.get(`/transactions/analytics/by-category?${params}`)
      return response.data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60,
  })

  const totalExpenses = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  return {
    transactions,
    categories,
    categoryBreakdown,
    totalExpenses,
    totalIncome,
    isLoading,
  }
}