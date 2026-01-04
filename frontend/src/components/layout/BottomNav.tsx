import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, PieChart, Sparkles, Calendar, Wallet } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useLanguage } from '../../contexts/LanguageContext'

export const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/stats', icon: PieChart, label: t('nav.stats') },
    { path: '/ai-chat', icon: Sparkles, label: t('nav.ai'), highlight: true },
    { path: '/subscriptions', icon: Calendar, label: t('nav.subscriptions') },
    { path: '/accounts', icon: Wallet, label: t('nav.wallet') }
  ]

  return (
    // Фиксированная позиция, z-[60] чтобы быть выше всех
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
      style={{
        // Отступ снизу: 0.75rem (12px) + Safe Area Bottom - ниже для лучшей видимости
        bottom: 'calc(0.75rem + var(--sab))',
      }}
    >
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center justify-between px-3 py-2.5 rounded-[24px] w-full max-w-sm relative overflow-hidden"
        style={{
          // Усиленный blur эффект для лучшей видимости контента
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          // Более прозрачный фон для демонстрации blur эффекта
          background: 'rgba(10, 10, 10, 0.75)',
          border: `1px solid rgba(255, 255, 255, 0.08)`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 1px rgba(255, 255, 255, 0.1) inset'
        }}
      >
        {/* Градиентная подложка для глубины */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0) 100%)'
          }}
        />
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && (location.pathname === '/app' || location.pathname === '/index.html'))
          const Icon = item.icon

          if (item.highlight) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.08 }}
                onClick={() => navigate(item.path)}
                className="relative -top-7 mx-2 w-20 h-20 rounded-full flex items-center justify-center z-50 cursor-pointer overflow-hidden shadow-2xl"
                style={{
                  background: premiumDesign.colors.gradients.primary,
                  boxShadow: '0 12px 40px rgba(99, 102, 241, 0.6), 0 0 2px rgba(255, 255, 255, 0.7) inset',
                  border: '3px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/25 to-transparent opacity-60" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
                <Icon
                  size={32}
                  className="text-white relative z-10"
                  style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))'
                  }}
                />
              </motion.button>
            )
          }

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer group z-10"
            >
              <div
                className={`relative z-20 p-2 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1.5' : 'group-hover:-translate-y-0.5'}`}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                }}
              >
                <Icon
                  size={24}
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]'
                      : 'text-neutral-500 group-hover:text-neutral-400'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.2))' : 'none'
                  }}
                />
              </div>

              {isActive && (
                 <motion.span
                   initial={{ opacity: 0, scale: 0.5, y: 5 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="text-[10px] font-bold text-white absolute bottom-0.5 tracking-wide z-20"
                   style={{
                     textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                   }}
                 >
                   {item.label}
                 </motion.span>
              )}
            </motion.button>
          )
        })}
      </motion.nav>
    </div>
  )
}