import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PremiumHeader } from './PremiumHeader'
import { useTheme } from '../../contexts/ThemeContext'
import { useEffect } from 'react'

const Layout = () => {
  const { theme, availableThemes } = useTheme()
  const location = useLocation()

  // Страницы, на которых НЕ нужен глобальный хедер (так как у них свой дизайн верха)
  const noHeaderRoutes = ['/', '/app', '/ai-chat']
  const shouldShowHeader = !noHeaderRoutes.includes(location.pathname)

  // Страницы, которым нужен полный контроль над высотой (без отступов Layout)
  const fullScreenRoutes = ['/ai-chat']
  const isFullScreen = fullScreenRoutes.includes(location.pathname)

  useEffect(() => {
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (selectedTheme) {
      document.body.style.backgroundColor = selectedTheme.colors.bg
      document.body.style.color = selectedTheme.colors.text
    }
    // Сброс цвета для чистоты
    return () => {
      document.body.style.backgroundColor = ''
      document.body.style.color = ''
    }
  }, [theme, availableThemes])

  return (
    <div className="relative min-h-[100dvh] w-full overflow-hidden bg-black text-white">
      {/*
        Фоновый шум/градиент для всего приложения (опционально)
        Добавляет дороговизны, если прозрачность небольшая
      */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Глобальный хедер показываем только там, где он нужен */}
      {shouldShowHeader && <PremiumHeader />}

      <main
        className={`relative z-10 w-full ${
          // Если это полный экран (чат), не добавляем отступы
          // Если обычная страница, добавляем отступ снизу под навигацию
          isFullScreen ? '' : 'pb-28'
        } ${
          // Если есть хедер, отступаем сверху, иначе 0
          shouldShowHeader ? 'pt-20' : ''
        }`}
      >
        {/* Container ограничиваем только на обычных страницах */}
        <div className={isFullScreen ? 'h-full w-full' : 'container mx-auto px-0 md:px-4'}>
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

export default Layout