/**
 * Telegram WebApp API Type Extensions
 * This file extends the Telegram WebApp types with additional properties
 */

interface TelegramWebApp {
  ready(): void
  expand(): void
  requestFullscreen?(): void
  BackButton: {
    show(): void
    hide(): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
  }
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
