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
    { path: '/app', icon: Home, label: t('home') },
    { path: '/stats', icon: PieChart, label: t('stats') },
    { path: '/ai-chat', icon: Sparkles, label: t('ai'), highlight: true }, // Центральная кнопка
    { path: '/subscriptions', icon: Calendar, label: t('subscriptions') },
    { path: '/accounts', icon: Wallet, label: t('wallet') }
  ]

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="flex items-center justify-between px-2 py-2 rounded-[24px] shadow-2xl backdrop-blur-xl w-full max-w-md"
        style={{
          background: 'rgba(15, 15, 15, 0.85)', // Глубокий черный
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          // Особый стиль для центральной кнопки (AI)
          if (item.highlight) {
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className="relative -top-5 mx-2 w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary-500/30 border border-white/10"
                style={{
                  background: premiumDesign.colors.gradients.primary,
                }}
              >
                <Icon size={24} className="text-white fill-white/20" />
              </motion.button>
            )
          }

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center w-full h-full py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-xl bg-white/5"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              <div className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${isActive ? '-translate-y-1' : ''}`}>
                <Icon
                  size={22}
                  className={`transition-colors duration-300 ${
                    isActive ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-neutral-500'
                  }`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>

              {isActive && (
                 <motion.span
                   initial={{ opacity: 0, scale: 0.5 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="text-[10px] font-medium text-white absolute bottom-1"
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