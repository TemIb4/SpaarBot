import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import deTranslations from '../locales/de.json'
import enTranslations from '../locales/en.json'
import ruTranslations from '../locales/ru.json'
import ukTranslations from '../locales/uk.json'

// Type for translation object structure
type TranslationObject = {
  [key: string]: string | TranslationObject
}

// All available translations
const translations = {
  de: deTranslations,
  en: enTranslations,
  ru: ruTranslations,
  uk: ukTranslations,
} as const

// Helper function to get nested value by path (e.g., 'dashboard.welcome')
function getNestedTranslation(obj: TranslationObject, path: string): string {
  const keys = path.split('.')
  let result: string | TranslationObject = obj

  for (const key of keys) {
    if (typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      // Return the path itself if translation not found (fallback)
      console.warn(`Translation key not found: ${path}`)
      return path
    }
  }

  return typeof result === 'string' ? result : path
}

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('spaarbot-language') || 'de'
  })

  const t = (key: string): string => {
    const lang = language as keyof typeof translations
    const dict = translations[lang] || translations.de
    return getNestedTranslation(dict as TranslationObject, key)
  }

  const setLanguage = (lang: string) => {
    console.log('🌐 Setting language to:', lang)
    setLanguageState(lang)
    localStorage.setItem('spaarbot-language', lang)
  }

  useEffect(() => {
    document.documentElement.lang = language
    console.log('🌐 Language applied:', language)
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