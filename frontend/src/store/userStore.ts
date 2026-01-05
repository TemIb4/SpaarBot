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
          console.log('[UserStore] Fetching user:', telegram_id)

          // Пытаемся получить существующего пользователя
          try {
            const response = await api.get(`/api/v1/users/${telegram_id}`)
            if (response.data) {
              console.log('[UserStore] Found existing user:', response.data)
              get().setUser(response.data)
              return
            }
          } catch (error: any) {
            console.log('[UserStore] User not found, creating new user')
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

          console.log('[UserStore] Creating new user with data:', newUserData)
          const createResponse = await api.post('/api/v1/users', newUserData)

          if (createResponse.data) {
            console.log('[UserStore] User created successfully:', createResponse.data)

            // Убедимся что пользователь правильно сохраняется
            const userData = {
              ...createResponse.data,
              telegram_id: createResponse.data.telegram_id,
              tier: createResponse.data.tier || 'free',
              is_premium: createResponse.data.is_premium || false
            }

            get().setUser(userData)

            // Устанавливаем язык из Telegram
            if (newUserData.language_code) {
              const supportedLangs = ['de', 'en', 'ru', 'uk']
              const userLang = newUserData.language_code.toLowerCase()
              if (supportedLangs.includes(userLang)) {
                localStorage.setItem('spaarbot-language', userLang)
                document.documentElement.lang = userLang
              }
            }

            console.log('[UserStore] User state updated:', get().user)
          } else {
            console.error('[UserStore] No data returned from create API')
          }

        } catch (error: any) {
          console.error('[UserStore] Error fetching/creating user:', error)
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
        // Очищаем только пользователя, но не удаляем storage полностью
        set({
          user: null,
          error: null,
          isPremium: false,
          isLoading: false
        })

        // Через небольшую задержку пытаемся снова инициализировать из Telegram
        setTimeout(() => {
          const tg = (window as any).Telegram?.WebApp
          if (tg?.initDataUnsafe?.user) {
            get().fetchOrCreateUser(tg.initDataUnsafe.user.id, tg.initDataUnsafe.user)
          }
        }, 500)
      },

      initialize: async () => {
        // Проверяем биометрическую аутентификацию
        const biometricEnabled = localStorage.getItem('spaarbot-biometric-enabled') === 'true'
        const tg = (window as any).Telegram?.WebApp

        if (biometricEnabled && tg?.BiometricManager) {
          const biometricManager = tg.BiometricManager

          // Проверяем доступность биометрии
          if (biometricManager.isBiometricAvailable) {
            try {
              // Запрашиваем биометрическую аутентификацию
              await new Promise<boolean>((resolve) => {
                biometricManager.authenticate({
                  reason: 'Please authenticate to access SpaarBot'
                }, (authenticated: boolean) => {
                  resolve(authenticated)
                })
              }).then((authenticated) => {
                if (!authenticated) {
                  set({
                    error: 'Biometric authentication failed',
                    isLoading: false
                  })
                  return
                }
              })
            } catch (error) {
              console.error('Biometric authentication error:', error)
            }
          }
        }

        // Проверяем сохраненного пользователя
        const savedUser = get().user

        if (savedUser?.telegram_id) {
          // Обновляем данные с сервера в фоне
          get().fetchOrCreateUser(savedUser.telegram_id, savedUser)
          return
        }

        // Проверяем Telegram WebApp
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