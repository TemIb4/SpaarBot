import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { AnimatedBackground } from './AnimatedBackground'
import { useTheme } from '../../contexts/ThemeContext'
import { useEffect } from 'react'

const Layout = () => {
  const { theme, availableThemes } = useTheme()

  useEffect(() => {
    console.log('🎨 Layout mounted, current theme:', theme)

    // Применяем тему к body
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (selectedTheme) {
      document.body.style.backgroundColor = selectedTheme.colors.bg
      document.body.style.color = selectedTheme.colors.text
    }
  }, [theme, availableThemes])

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <main className="relative z-10 pb-20">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default Layout