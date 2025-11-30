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
  gradient?: {
    from: string
    via: string
    to: string
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
      name: '🌙 Midnight Dark',
      preview: 'linear-gradient(135deg, #3b0764 0%, #a855f7 50%, #f3e8ff 100%)',
      description: 'Klassisches dunkles Theme',
      premium: false,
      colors: {
        primary: '#a855f7',
        secondary: '#8b5cf6',
        accent: '#c084fc',
        bg: '#0a0a0a',
        bgCard: '#1a1a1a',
        text: '#ffffff'
      },
      gradient: {
        from: '#3b0764',
        via: '#a855f7',
        to: '#f3e8ff'
      }
    },
    {
      id: 'blue',
      name: '🌊 Ocean Deep',
      preview: 'linear-gradient(135deg, #0c4a6e 0%, #0ea5e9 50%, #e0f2fe 100%)',
      description: 'Beruhigendes Ozean-Blau',
      premium: false,
      colors: {
        primary: '#0ea5e9',
        secondary: '#0284c7',
        accent: '#38bdf8',
        bg: '#0f172a',
        bgCard: '#1e293b',
        text: '#ffffff'
      },
      gradient: {
        from: '#0c4a6e',
        via: '#0ea5e9',
        to: '#e0f2fe'
      }
    },
    {
      id: 'slate',
      name: '⚡ Steel Gray',
      preview: 'linear-gradient(135deg, #1e293b 0%, #64748b 50%, #f1f5f9 100%)',
      description: 'Professionelles Grau',
      premium: false,
      colors: {
        primary: '#64748b',
        secondary: '#475569',
        accent: '#94a3b8',
        bg: '#0f1419',
        bgCard: '#1e293b',
        text: '#f1f5f9'
      },
      gradient: {
        from: '#1e293b',
        via: '#64748b',
        to: '#f1f5f9'
      }
    },
    {
      id: 'purple',
      name: '👑 Royal Purple',
      preview: 'linear-gradient(135deg, #581c87 0%, #c026d3 50%, #fae8ff 100%)',
      description: 'Majestätisches Lila',
      premium: false,
      colors: {
        primary: '#c026d3',
        secondary: '#a21caf',
        accent: '#d946ef',
        bg: '#1a0a2e',
        bgCard: '#2d1b4e',
        text: '#ffffff'
      },
      gradient: {
        from: '#581c87',
        via: '#c026d3',
        to: '#fae8ff'
      }
    },
    {
      id: 'emerald',
      name: '🌲 Forest Emerald',
      preview: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #d1fae5 100%)',
      description: 'Natürliches Smaragdgrün',
      premium: false,
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        bg: '#022c22',
        bgCard: '#064e3b',
        text: '#ffffff'
      },
      gradient: {
        from: '#064e3b',
        via: '#10b981',
        to: '#d1fae5'
      }
    },
    {
      id: 'rose',
      name: '🌹 Sunset Rose',
      preview: 'linear-gradient(135deg, #9f1239 0%, #f43f5e 50%, #ffe4e6 100%)',
      description: 'Romantisches Rosenrot',
      premium: false,
      colors: {
        primary: '#f43f5e',
        secondary: '#e11d48',
        accent: '#fb7185',
        bg: '#1c0a0f',
        bgCard: '#2d1319',
        text: '#ffffff'
      },
      gradient: {
        from: '#9f1239',
        via: '#f43f5e',
        to: '#ffe4e6'
      }
    },
    {
      id: 'amber',
      name: '✨ Golden Amber',
      preview: 'linear-gradient(135deg, #92400e 0%, #f59e0b 50%, #fef3c7 100%)',
      description: 'Warmes Gold',
      premium: false,
      colors: {
        primary: '#f59e0b',
        secondary: '#d97706',
        accent: '#fbbf24',
        bg: '#1c1508',
        bgCard: '#2d210d',
        text: '#ffffff'
      },
      gradient: {
        from: '#92400e',
        via: '#f59e0b',
        to: '#fef3c7'
      }
    },
    {
      id: 'cyan',
      name: '❄️ Arctic Cyan',
      preview: 'linear-gradient(135deg, #0e7490 0%, #06b6d4 50%, #cffafe 100%)',
      description: 'Eisiges Cyan',
      premium: false,
      colors: {
        primary: '#06b6d4',
        secondary: '#0891b2',
        accent: '#22d3ee',
        bg: '#083344',
        bgCard: '#164e63',
        text: '#ffffff'
      },
      gradient: {
        from: '#0e7490',
        via: '#06b6d4',
        to: '#cffafe'
      }
    },
    {
      id: 'violet',
      name: '🔮 Deep Violet',
      preview: 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 50%, #ede9fe 100%)',
      description: 'Tiefes Violett',
      premium: false,
      colors: {
        primary: '#8b5cf6',
        secondary: '#7c3aed',
        accent: '#a78bfa',
        bg: '#1e1b4b',
        bgCard: '#312e81',
        text: '#ffffff'
      },
      gradient: {
        from: '#5b21b6',
        via: '#8b5cf6',
        to: '#ede9fe'
      }
    },
    {
      id: 'pink',
      name: '💖 Bubble Gum',
      preview: 'linear-gradient(135deg, #9f1239 0%, #ec4899 50%, #fce7f3 100%)',
      description: 'Süßes Pink',
      premium: false,
      colors: {
        primary: '#ec4899',
        secondary: '#db2777',
        accent: '#f472b6',
        bg: '#1f0a1a',
        bgCard: '#3f1728',
        text: '#ffffff'
      },
      gradient: {
        from: '#9f1239',
        via: '#ec4899',
        to: '#fce7f3'
      }
    },
    {
      id: 'teal',
      name: '🏝️ Ocean Teal',
      preview: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #ccfbf1 100%)',
      description: 'Tropisches Türkis',
      premium: false,
      colors: {
        primary: '#14b8a6',
        secondary: '#0d9488',
        accent: '#2dd4bf',
        bg: '#042f2e',
        bgCard: '#134e4a',
        text: '#ffffff'
      },
      gradient: {
        from: '#0f766e',
        via: '#14b8a6',
        to: '#ccfbf1'
      }
    },
    {
      id: 'indigo',
      name: '🌌 Midnight Indigo',
      preview: 'linear-gradient(135deg, #3730a3 0%, #6366f1 50%, #e0e7ff 100%)',
      description: 'Mystisches Indigo',
      premium: false,
      colors: {
        primary: '#6366f1',
        secondary: '#4f46e5',
        accent: '#818cf8',
        bg: '#1e1b4b',
        bgCard: '#312e81',
        text: '#ffffff'
      },
      gradient: {
        from: '#3730a3',
        via: '#6366f1',
        to: '#e0e7ff'
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

    if (selectedTheme.gradient) {
      root.style.setProperty('--gradient-from', selectedTheme.gradient.from)
      root.style.setProperty('--gradient-via', selectedTheme.gradient.via)
      root.style.setProperty('--gradient-to', selectedTheme.gradient.to)

      console.log('✅ Bright gradients applied:', selectedTheme.gradient)
    }

    document.body.style.backgroundColor = selectedTheme.colors.bg
    document.body.style.color = selectedTheme.colors.text

    console.log('✅ Theme applied!')
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