import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import { api } from '../lib/api'
import { logger } from '../utils/logger'

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
        logger.info('[UserStore] setUser called', { user, isPremium })
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
          logger.info('[UserStore] Fetching user', { telegram_id, userData })

          // Пытаемся получить существующего пользователя
          try {
            const response = await api.get(`/api/v1/users/${telegram_id}`)
            if (response.data) {
              logger.info('[UserStore] Found existing user', response.data)
              get().setUser(response.data)
              return
            }
          } catch (error: any) {
            logger.warn('[UserStore] User not found, will create new user', { status: error.response?.status })
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

          logger.info('[UserStore] Creating new user', newUserData)
          const createResponse = await api.post('/api/v1/users', newUserData)

          if (createResponse.data) {
            logger.info('[UserStore] User created successfully', createResponse.data)

            // Убедимся что пользователь правильно сохраняется
            const finalUserData = {
              ...createResponse.data,
              telegram_id: createResponse.data.telegram_id,
              tier: createResponse.data.tier || 'free',
              is_premium: createResponse.data.is_premium || false
            }

            get().setUser(finalUserData)

            // Устанавливаем язык из Telegram
            if (newUserData.language_code) {
              const supportedLangs = ['de', 'en', 'ru', 'uk']
              const userLang = newUserData.language_code.toLowerCase()
              if (supportedLangs.includes(userLang)) {
                localStorage.setItem('spaarbot-language', userLang)
                document.documentElement.lang = userLang
                logger.info('[UserStore] Language set', { userLang })
              }
            }

            logger.info('[UserStore] User state updated', get().user)
          } else {
            logger.error('[UserStore] No data returned from create API')
            set({
              error: 'No data returned from server',
              isLoading: false
            })
          }

        } catch (error: any) {
          logger.error('[UserStore] Error fetching/creating user', {
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
          })
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
        logger.info('[UserStore] Initializing app')

        const tg = (window as any).Telegram?.WebApp
        logger.info('[UserStore] Telegram WebApp available', { available: !!tg })

        // Проверяем биометрическую аутентификацию
        const biometricEnabled = localStorage.getItem('spaarbot-biometric-enabled') === 'true'
        logger.info('[UserStore] Biometric status', { biometricEnabled })

        if (biometricEnabled && tg?.BiometricManager) {
          const biometricManager = tg.BiometricManager
          logger.info('[UserStore] BiometricManager available', {
            available: biometricManager.isBiometricAvailable,
            type: biometricManager.biometricType
          })

          // Проверяем доступность биометрии
          if (biometricManager.isBiometricAvailable) {
            try {
              logger.info('[UserStore] Requesting biometric authentication')
              // Запрашиваем биометрическую аутентификацию
              const authenticated = await new Promise<boolean>((resolve) => {
                biometricManager.authenticate({
                  reason: 'Please authenticate to access SpaarBot'
                }, (success: boolean) => {
                  logger.info('[UserStore] Biometric result', { success })
                  resolve(success)
                })
              })

              if (!authenticated) {
                logger.error('[UserStore] Biometric authentication failed')
                set({
                  error: 'Biometric authentication failed',
                  isLoading: false
                })
                return
              }
            } catch (error) {
              logger.error('[UserStore] Biometric error', error)
            }
          }
        }

        // Проверяем сохраненного пользователя
        const savedUser = get().user
        logger.info('[UserStore] Saved user', { savedUser })

        if (savedUser?.telegram_id) {
          // Обновляем данные с сервера в фоне
          logger.info('[UserStore] Refreshing saved user from server')
          get().fetchOrCreateUser(savedUser.telegram_id, savedUser)
          return
        }

        // Проверяем Telegram WebApp
        if (!tg?.initDataUnsafe?.user) {
          logger.error('[UserStore] No Telegram user data available')
          set({
            error: 'Telegram Benutzerdaten nicht verfügbar. Bitte öffne die App über Telegram.',
            isLoading: false
          })
          return
        }

        const telegramUser = tg.initDataUnsafe.user
        logger.info('[UserStore] Telegram user from WebApp', telegramUser)

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