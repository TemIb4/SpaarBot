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
    { path: '/accounts', icon: Wallet, label: 'Wallet' }
  ]

  return (
    // Фиксированная позиция, z-[60] чтобы быть выше всех
    <div
      className="fixed left-0 right-0 z-[60] flex justify-center px-4 pointer-events-none"
      style={{
        // Отступ снизу: 1.5rem (24px) + Safe Area Bottom
        bottom: 'calc(1.5rem + var(--sab))',
      }}
    >
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center justify-between px-3 py-2.5 rounded-[24px] w-full max-w-sm backdrop-blur-xl"
        style={{
          // ИСПОЛЬЗУЕМ premiumDesign
          background: 'rgba(18, 18, 18, 0.95)', // Почти черный, полупрозрачный
          border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          boxShadow: premiumDesign.effects.shadow['2xl']
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path === '/' && (location.pathname === '/app' || location.pathname === '/index.html'))
          const Icon = item.icon

          if (item.highlight) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className="relative -top-6 mx-1 w-14 h-14 rounded-full flex items-center justify-center z-50 cursor-pointer overflow-hidden border border-white/20"
                style={{
                  // ИСПОЛЬЗУЕМ premiumDesign для градиента и тени
                  background: premiumDesign.colors.gradients.primary,
                  boxShadow: premiumDesign.effects.shadow.glow
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-50" />
                <Icon size={24} className="text-white relative z-10" />
              </motion.button>
            )
          }

          return (
            <motion.button
              key={item.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-full h-full py-1 cursor-pointer group"
            >
              <div
                className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1.5' : ''}`}
                style={{
                  // При ховере используем прозрачный белый из системы дизайна
                  backgroundColor: isActive ? 'transparent' : 'transparent'
                }}
              >
                <Icon
                  size={24}
                  className={`transition-colors duration-300 ${isActive ? 'text-white drop-shadow-md' : 'text-neutral-500'}`}
                  strokeWidth={isActive ? 2.5 : 2}
                  style={{
                    color: isActive ? '#fff' : premiumDesign.colors.neutral[500]
                  }}
                />
              </div>

              {isActive && (
                 <motion.span
                   initial={{ opacity: 0, scale: 0.5, y: 5 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="text-[10px] font-bold text-white absolute bottom-0.5 tracking-wide"
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