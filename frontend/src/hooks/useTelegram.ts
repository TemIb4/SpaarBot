/**
 * Custom hook for Telegram WebApp SDK
 */
import { useEffect, useState } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

interface UseTelegramReturn {
  webApp: any | null
  user: TelegramUser | null
  isReady: boolean
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
}

export const useTelegram = (): UseTelegramReturn => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()
      tg.expand()
      // ✅ Убрали неподдерживаемые методы для версии 6.0:
      // - setHeaderColor
      // - setBackgroundColor
      // - setClosingConfirmation
      setIsReady(true)
    }
  }, [])

  if (typeof window === 'undefined' || !window.Telegram?.WebApp) {
    return {
      webApp: null,
      user: null,
      isReady: false,
      colorScheme: 'light',
      themeParams: {},
    }
  }

  const webApp = window.Telegram.WebApp

  return {
    webApp,
    user: webApp.initDataUnsafe.user || null,
    isReady,
    colorScheme: webApp.colorScheme,
    themeParams: webApp.themeParams,
  }
}