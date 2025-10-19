/**
 * Color Themes Configuration
 */

export interface ColorTheme {
  id: string
  name: string
  emoji: string
  gradient: {
    from: string
    via: string
    to: string
  }
  colors: {
    primary: string
    secondary: string
    accent: string
    text: string
    textSecondary: string
    background: string
    card: string
    cardHover: string
    border: string
  }
}

export const colorThemes: ColorTheme[] = [
  {
    id: 'mysterious-forest',
    name: 'Таинственный лес',
    emoji: '🌲',
    gradient: {
      from: '#054c76',
      via: '#0c192a',
      to: '#471c3a',
    },
    colors: {
      primary: '#054c76',
      secondary: '#471c3a',
      accent: '#06d6a0',
      text: '#ffffff',
      textSecondary: '#b0c4de',
      background: '#0c192a',
      card: 'rgba(255, 255, 255, 0.08)',
      cardHover: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  {
    id: 'moonlight',
    name: 'Лунная ночь',
    emoji: '🌙',
    gradient: {
      from: '#fffde7',
      via: '#fffde7',
      to: '#111635',
    },
    colors: {
      primary: '#5e60ce',
      secondary: '#7400b8',
      accent: '#ffd60a',
      text: '#1a1a2e',
      textSecondary: '#4a4a68',
      background: '#fffde7',
      card: 'rgba(255, 255, 255, 0.9)',
      cardHover: 'rgba(255, 255, 255, 1)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
  },
  {
    id: 'space',
    name: 'Космос',
    emoji: '🚀',
    gradient: {
      from: '#000000',
      via: '#0d1521',
      to: '#070e18',
    },
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      accent: '#f093fb',
      text: '#ffffff',
      textSecondary: '#a8a8b3',
      background: '#000000',
      card: 'rgba(255, 255, 255, 0.05)',
      cardHover: 'rgba(255, 255, 255, 0.08)',
      border: 'rgba(255, 255, 255, 0.08)',
    },
  },
  {
    id: 'twilight-grape',
    name: 'Сумеречный виноград',
    emoji: '🍇',
    gradient: {
      from: '#8e7cc3',
      via: '#41326d',
      to: '#000000',
    },
    colors: {
      primary: '#8e7cc3',
      secondary: '#c77dff',
      accent: '#e0aaff',
      text: '#ffffff',
      textSecondary: '#d4b5ff',
      background: '#1a0b2e',
      card: 'rgba(255, 255, 255, 0.08)',
      cardHover: 'rgba(255, 255, 255, 0.12)',
      border: 'rgba(255, 255, 255, 0.1)',
    },
  },
  {
    id: 'marshmallow-sunset',
    name: 'Зефирный закат',
    emoji: '🌸',
    gradient: {
      from: '#fffbfc',
      via: '#fbe8ee',
      to: '#ec96b1',
    },
    colors: {
      primary: '#ec96b1',
      secondary: '#f4a6c3',
      accent: '#ff6b9d',
      text: '#2d1b2e',
      textSecondary: '#6b4c5a',
      background: '#fff5f7',
      card: 'rgba(255, 255, 255, 0.8)',
      cardHover: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(236, 150, 177, 0.2)',
    },
  },
  {
    id: 'mango-kiwi',
    name: 'Манго и киви',
    emoji: '🥭',
    gradient: {
      from: '#f58700',
      via: '#bbb248',
      to: '#17cfbb',
    },
    colors: {
      primary: '#f58700',
      secondary: '#17cfbb',
      accent: '#ffd60a',
      text: '#1a1a1a',
      textSecondary: '#4a4a4a',
      background: '#fffef7',
      card: 'rgba(255, 255, 255, 0.8)',
      cardHover: 'rgba(255, 255, 255, 0.95)',
      border: 'rgba(245, 135, 0, 0.2)',
    },
  },
]

export const getThemeById = (id: string): ColorTheme => {
  return colorThemes.find(theme => theme.id === id) || colorThemes[0]
}