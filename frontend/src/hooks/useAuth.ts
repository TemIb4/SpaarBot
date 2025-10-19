/**
 * Authentication hook
 */
import { useQuery } from '@tanstack/react-query'
import { useTelegram } from './useTelegram'
import { api } from '@/lib/api'
import type { User } from '@/types' // ✅ Изменили путь

export const useAuth = () => {
  const { user: telegramUser } = useTelegram()

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ['user', telegramUser?.id],
    queryFn: async () => {
      if (!telegramUser?.id) {
        throw new Error('No Telegram user')
      }
      const response = await api.get(`/auth/me?telegram_id=${telegramUser.id}`)
      return response.data
    },
    enabled: !!telegramUser?.id,
    staleTime: Infinity,
  })

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    error,
  }
}