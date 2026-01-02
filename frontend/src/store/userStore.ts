import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { api } from '../lib/api'

interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  isPremium: boolean

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearUser: () => void

  fetchOrCreateUser: (telegram_id: number, userData: any) => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,
      isPremium: false,

      setUser: (user) => {
        const isPremium = user?.tier === 'premium' || user?.is_premium === true
        set({
          user,
          error: null,
          isPremium,
          isLoading: false
        })
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => {
        set({ error, isLoading: false })
      },

      clearUser: () => {
        set({
          user: null,
          error: null,
          isPremium: false,
          isLoading: false
        })
      },

      fetchOrCreateUser: async (telegram_id: number, userData: any) => {
        set({ isLoading: true, error: null })

        try {
          // Пытаемся получить существующего пользователя
          try {
            const response = await api.get(`/api/v1/users/${telegram_id}`)
            if (response.data) {
              get().setUser(response.data)
              return
            }
          } catch (error: any) {
            if (error.response?.status !== 404) {
              throw error
            }
          }

          // Если пользователь не найден - создаем нового
          const newUserData = {
            telegram_id: telegram_id,
            first_name: userData.first_name || 'User',
            last_name: userData.last_name,
            username: userData.username,
            language_code: userData.language_code || 'de',
          }

          const createResponse = await api.post('/api/v1/users', newUserData)

          if (createResponse.data) {
            get().setUser(createResponse.data)

            // Устанавливаем язык из Telegram
            if (userData.language_code) {
              const supportedLangs = ['de', 'en', 'ru', 'uk']
              const userLang = userData.language_code.toLowerCase()
              if (supportedLangs.includes(userLang)) {
                localStorage.setItem('spaarbot-language', userLang)
                document.documentElement.lang = userLang
              }
            }
          }

        } catch (error: any) {
          set({
            error: 'Fehler beim Laden des Benutzers. Bitte versuche es später erneut.',
            isLoading: false
          })
        }
      },

      updateUser: async (data: Partial<User>) => {
        const currentUser = get().user
        if (!currentUser) {
          set({ error: 'Kein Benutzer zum Aktualisieren' })
          return
        }

        set({ isLoading: true, error: null })

        try {
          const response = await api.patch(
            `/api/v1/users/${currentUser.telegram_id}`,
            data
          )

          if (response.data) {
            get().setUser(response.data)
          }

        } catch (error: any) {
          set({ error: 'Fehler beim Aktualisieren' })
        }
      },

      logout: () => {
        localStorage.removeItem('spaarbot-user-storage')
        localStorage.removeItem('spaarbot-language')
        localStorage.removeItem('spaarbot-theme')
        localStorage.removeItem('spaarbot-ui-mode')

        set({
          user: null,
          error: null,
          isPremium: false,
          isLoading: false
        })
      },

      initialize: async () => {
        // Проверяем сохраненного пользователя
        const savedUser = get().user

        if (savedUser?.telegram_id) {
          // Обновляем данные с сервера в фоне
          get().fetchOrCreateUser(savedUser.telegram_id, savedUser)
          return
        }

        // Проверяем Telegram WebApp
        const tg = (window as any).Telegram?.WebApp

        if (!tg?.initDataUnsafe?.user) {
          set({
            error: 'Telegram Benutzerdaten nicht verfügbar. Bitte öffne die App über Telegram.',
            isLoading: false
          })
          return
        }

        const telegramUser = tg.initDataUnsafe.user

        // Загружаем или создаем пользователя
        await get().fetchOrCreateUser(telegramUser.id, telegramUser)
      },
    }),
    {
      name: 'spaarbot-user-storage',
      partialize: (state) => ({
        user: state.user,
        isPremium: state.isPremium,
      }),
    }
  )
)

// Auto-initialize
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useUserStore.getState().initialize()
  }, 100)
}