import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface ColorTheme {
  id: string
  name: string
  preview: string
  description: string
  premium?: boolean
  colors: {
    primary: string
    bg: string
    text: string
  }
}

interface ThemeContextType {
  theme: string
  setTheme: (theme: string) => void
  availableThemes: ColorTheme[]
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('spaarbot-theme') || 'dark'
  })

  const availableThemes: ColorTheme[] = [
    {
      id: 'dark',
      name: 'Dark Mode',
      preview: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      description: 'Klassisches dunkles Theme',
      premium: false,
      colors: { primary: '#6366f1', bg: '#0a0a0a', text: '#ffffff' }
    },
    {
      id: 'blue',
      name: 'Ocean Blue',
      preview: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      description: 'Beruhigendes Blau',
      premium: false,
      colors: { primary: '#3b82f6', bg: '#0f172a', text: '#ffffff' }
    },
    {
      id: 'purple',
      name: 'Purple Haze',
      preview: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)',
      description: 'Elegantes Lila',
      premium: true,
      colors: { primary: '#a855f7', bg: '#1a0a2e', text: '#ffffff' }
    },
    {
      id: 'emerald',
      name: 'Emerald Green',
      preview: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      description: 'Frisches Grün',
      premium: true,
      colors: { primary: '#10b981', bg: '#022c22', text: '#ffffff' }
    },
  ]

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme)
    localStorage.setItem('spaarbot-theme', newTheme)
  }

  useEffect(() => {
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (selectedTheme) {
      document.body.style.setProperty('--color-primary', selectedTheme.colors.primary)
      document.body.style.setProperty('--color-bg', selectedTheme.colors.bg)
      document.body.style.setProperty('--color-text', selectedTheme.colors.text)
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}