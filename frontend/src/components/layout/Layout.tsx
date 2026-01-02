import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { PremiumHeader } from './PremiumHeader'
import { useTheme } from '../../contexts/ThemeContext'
import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const Layout = () => {
  const { theme, availableThemes } = useTheme()
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'instant' })
  }, [location.pathname])

  useEffect(() => {
    const selectedTheme = availableThemes.find(t => t.id === theme)
    if (selectedTheme) document.body.style.backgroundColor = selectedTheme.colors.bg
  }, [theme, availableThemes])

  return (
    <div className="relative h-[100dvh] w-full flex flex-col bg-black text-white overflow-hidden">

      {/* Фон */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Глобальный хедер ВСЕГДА отображается */}
      <div className="relative z-50 flex-none">
        <PremiumHeader />
      </div>

      {/* Скроллящийся контент */}
      <main
        ref={scrollRef}
        className="flex-1 relative z-10 w-full overflow-y-auto overflow-x-hidden"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div
          className="w-full min-h-full px-4 md:px-0 md:container md:mx-auto"
          style={{
            // Отступ сверху = высота хедера + 20px "воздуха"
            paddingTop: 'calc(var(--header-total-height) + 20px)',
            // Отступ снизу = высота навигации + безопасная зона + 20px
            paddingBottom: 'calc(var(--bottom-nav-height) + var(--sab) + 20px)'
          }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </div>
      </main>

      {/* Нижняя навигация */}
      <BottomNav />
    </div>
  )
}

export default Layout