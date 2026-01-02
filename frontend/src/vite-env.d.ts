/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_PREFIX: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {};

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: {
          query_id?: string
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
          }
          auth_date?: number
          hash?: string
        }
        version: string
        platform: string
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        isClosingConfirmationEnabled: boolean

        // Кнопка Назад
        BackButton: {
          isVisible: boolean
          onClick(callback: () => void): void
          offClick(callback: () => void): void
          show(): void
          hide(): void
        }

        // Главная кнопка
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          isProgressVisible: boolean
          setText(text: string): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
          show(): void
          hide(): void
          enable(): void
          disable(): void
          showProgress(leaveActive?: boolean): void
          hideProgress(): void
        }

        // Вибрация
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }

        // Методы
        ready(): void
        expand(): void
        close(): void
        enableClosingConfirmation(): void
        disableClosingConfirmation(): void
        setHeaderColor(color: string): void
        setBackgroundColor(color: string): void
        showConfirm(message: string, callback?: (ok: boolean) => void): void
        showPopup(params: any, callback?: (id: string) => void): void
        showAlert(message: string, callback?: () => void): void

        // Новые методы (могут отсутствовать в старых версиях)
        requestFullscreen?(): void
        exitFullscreen?(): void
        addToHomeScreen?(): void
        checkHomeScreenStatus?(callback: (status: string) => void): void

        // События
        onEvent(eventType: string, callback: () => void): void
        offEvent(eventType: string, callback: () => void): void
      }
    }
  }
}