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
        console.log('👤 User loaded:', user?.first_name, 'ID:', user?.telegram_id, 'Premium:', isPremium)
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => {
        set({ error, isLoading: false })
        console.error('❌ User error:', error)
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
          console.log('🔄 Fetching or creating user:', telegram_id)

          // Пытаемся получить существующего пользователя
          try {
            const response = await api.get(`/api/v1/users/${telegram_id}`)
            if (response.data) {
              console.log('✅ User found in database')
              get().setUser(response.data)
              return
            }
          } catch (error: any) {
            if (error.response?.status !== 404) {
              throw error
            }
            console.log('📝 User not found, creating new user')
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
            console.log('✅ User created successfully')
            get().setUser(createResponse.data)

            // Устанавливаем язык из Telegram
            if (userData.language_code) {
              const supportedLangs = ['de', 'en', 'ru', 'uk']
              const userLang = userData.language_code.toLowerCase()
              if (supportedLangs.includes(userLang)) {
                localStorage.setItem('spaarbot-language', userLang)
                document.documentElement.lang = userLang
                console.log('🌍 Language auto-set to:', userLang)
              }
            }
          }

        } catch (error: any) {
          console.error('❌ Failed to fetch/create user:', error.message)
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
          console.log('💾 Updating user:', data)

          const response = await api.patch(
            `/api/v1/users/${currentUser.telegram_id}`,
            data
          )

          if (response.data) {
            get().setUser(response.data)
            console.log('✅ User updated successfully')
          }

        } catch (error: any) {
          console.error('❌ Failed to update user:', error.message)
          set({ error: 'Fehler beim Aktualisieren' })
        }
      },

      logout: () => {
        console.log('👋 Logging out')

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
        console.log('🚀 Initializing user store')

        // Проверяем сохраненного пользователя
        const savedUser = get().user

        if (savedUser?.telegram_id) {
          console.log('✅ Found saved user:', savedUser.first_name)
          // Обновляем данные с сервера в фоне
          get().fetchOrCreateUser(savedUser.telegram_id, savedUser)
          return
        }

        // Проверяем Telegram WebApp
        const tg = (window as any).Telegram?.WebApp

        if (!tg?.initDataUnsafe?.user) {
          console.error('❌ No Telegram user data available')
          set({
            error: 'Telegram Benutzerdaten nicht verfügbar. Bitte öffne die App über Telegram.',
            isLoading: false
          })
          return
        }

        const telegramUser = tg.initDataUnsafe.user
        console.log('✅ Telegram user detected:', {
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username,
        })

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