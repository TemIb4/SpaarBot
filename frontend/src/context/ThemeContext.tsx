/**
 * Theme Context Provider with Color Themes
 */
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ColorTheme, colorThemes, getThemeById } from '@/config/colorThemes'

interface ThemeContextType {
  currentTheme: ColorTheme
  setTheme: (themeId: string) => void
  availableThemes: ColorTheme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(() => {
    const savedThemeId = localStorage.getItem('color-theme')
    return savedThemeId ? getThemeById(savedThemeId) : colorThemes[0]
  })

  useEffect(() => {
    // Применяем CSS переменные
    const root = document.documentElement
    root.style.setProperty('--gradient-from', currentTheme.gradient.from)
    root.style.setProperty('--gradient-via', currentTheme.gradient.via)
    root.style.setProperty('--gradient-to', currentTheme.gradient.to)
    root.style.setProperty('--color-primary', currentTheme.colors.primary)
    root.style.setProperty('--color-secondary', currentTheme.colors.secondary)
    root.style.setProperty('--color-accent', currentTheme.colors.accent)
    root.style.setProperty('--color-text', currentTheme.colors.text)
    root.style.setProperty('--color-text-secondary', currentTheme.colors.textSecondary)
    root.style.setProperty('--color-background', currentTheme.colors.background)
    root.style.setProperty('--color-card', currentTheme.colors.card)
    root.style.setProperty('--color-card-hover', currentTheme.colors.cardHover)
    root.style.setProperty('--color-border', currentTheme.colors.border)

    localStorage.setItem('color-theme', currentTheme.id)
  }, [currentTheme])

  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId)
    setCurrentTheme(theme)
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, availableThemes: colorThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}