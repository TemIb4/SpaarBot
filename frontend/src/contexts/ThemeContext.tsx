import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

export interface ColorTheme {
  id: string
  name: string
  preview: string
  description: string
  premium?: boolean
  colors: {
    primary: string
    secondary: string
    accent: string
    bg: string
    bgCard: string
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
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#a78bfa',
        bg: '#0a0a0a',
        bgCard: '#1a1a1a',
        text: '#ffffff'
      }
    },
    {
      id: 'blue',
      name: 'Ocean Blue',
      preview: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      description: 'Beruhigendes Blau',
      premium: false,
      colors: {
        primary: '#3b82f6',
        secondary: '#2563eb',
        accent: '#60a5fa',
        bg: '#0f172a',
        bgCard: '#1e293b',
        text: '#ffffff'
      }
    },
    {
      id: 'purple',
      name: 'Purple Haze',
      preview: 'linear-gradient(135deg, #6b21a8 0%, #a855f7 100%)',
      description: 'Elegantes Lila',
      premium: true,
      colors: {
        primary: '#a855f7',
        secondary: '#9333ea',
        accent: '#c084fc',
        bg: '#1a0a2e',
        bgCard: '#2d1b4e',
        text: '#ffffff'
      }
    },
    {
      id: 'emerald',
      name: 'Emerald Green',
      preview: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
      description: 'Frisches Grün',
      premium: true,
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        bg: '#022c22',
        bgCard: '#064e3b',
        text: '#ffffff'
      }
    },
  ]

  const setTheme = (newTheme: string) => {
    console.log('🎨 Setting theme to:', newTheme)
    setThemeState(newTheme)
    localStorage.setItem('spaarbot-theme', newTheme)
  }

  useEffect(() => {
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (!selectedTheme) return

    console.log('🎨 Applying theme:', theme)

    const root = document.documentElement
    root.style.setProperty('--color-primary', selectedTheme.colors.primary)
    root.style.setProperty('--color-secondary', selectedTheme.colors.secondary)
    root.style.setProperty('--color-accent', selectedTheme.colors.accent)
    root.style.setProperty('--color-bg', selectedTheme.colors.bg)
    root.style.setProperty('--color-bg-card', selectedTheme.colors.bgCard)
    root.style.setProperty('--color-text', selectedTheme.colors.text)

    document.body.style.backgroundColor = selectedTheme.colors.bg
    document.body.style.color = selectedTheme.colors.text

    console.log('✅ Theme applied successfully')
  }, [theme, availableThemes])

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