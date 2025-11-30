// Layout.tsx - БЕЗ АНИМАЦИЙ

import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PremiumHeader } from './PremiumHeader'
import { useTheme } from '../../contexts/ThemeContext'
import { useEffect } from 'react'

const Layout = () => {
  const { theme, availableThemes } = useTheme()

  useEffect(() => {
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (selectedTheme) {
      document.body.style.backgroundColor = selectedTheme.colors.bg
      document.body.style.color = selectedTheme.colors.text
    }
  }, [theme, availableThemes])

  return (
    <div className="relative min-h-screen">
      <PremiumHeader />

      <main className="relative z-10 pb-20 pt-20">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default Layout