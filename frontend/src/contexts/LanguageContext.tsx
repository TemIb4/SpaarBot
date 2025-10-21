import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

// Простые переводы
const translations = {
  de: {
    upgrade: 'Upgrade',
    premium_required: 'Premium erforderlich',
    unlock_feature: 'Diese Funktion ist nur für Premium-Nutzer verfügbar',
    get_premium: 'Premium holen',
  },
  en: {
    upgrade: 'Upgrade',
    premium_required: 'Premium Required',
    unlock_feature: 'This feature is only available for Premium users',
    get_premium: 'Get Premium',
  },
  ru: {
    upgrade: 'Обновить',
    premium_required: 'Требуется Premium',
    unlock_feature: 'Эта функция доступна только для Premium пользователей',
    get_premium: 'Получить Premium',
  },
  uk: {
    upgrade: 'Оновити',
    premium_required: 'Потрібен Premium',
    unlock_feature: 'Ця функція доступна тільки для Premium користувачів',
    get_premium: 'Отримати Premium',
  },
}

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('spaarbot-language') || 'de'
  })

  const t = (key: string): string => {
    const lang = language as keyof typeof translations
    const dict = translations[lang] || translations.de
    return dict[key as keyof typeof dict] || key
  }

  useEffect(() => {
    localStorage.setItem('spaarbot-language', language)
    document.documentElement.lang = language
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within LanguageProvider')
  return context
}