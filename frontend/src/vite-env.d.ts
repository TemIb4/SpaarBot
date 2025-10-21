/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_API_PREFIX: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
/// <reference types="vite/client" />

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

      // Methods
      ready: () => void
      expand: () => void
      close: () => void
      enableClosingConfirmation: () => void
      disableClosingConfirmation: () => void
      setHeaderColor: (color: string) => void
      setBackgroundColor: (color: string) => void
      showAlert: (message: string) => void
      showConfirm: (message: string) => void
      showPopup: (params: any, callback?: (id: string) => void) => void

      // Events
      onEvent: (eventType: string, callback: () => void) => void
      offEvent: (eventType: string, callback: () => void) => void
    }
  }
}