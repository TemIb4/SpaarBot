import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, BarChart3, Calendar, Sparkles } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useLanguage } from '../../contexts/LanguageContext'

export const BottomNav = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const navItems = [
    { path: '/', icon: Home, label: t('home') },
    { path: '/stats', icon: BarChart3, label: t('stats') },
    { path: '/ai', icon: Sparkles, label: t('ai') },
    { path: '/subscriptions', icon: Calendar, label: t('subscriptions') }
  ]

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      style={{
        background: premiumDesign.glass.dark.background,
        backdropFilter: premiumDesign.glass.dark.backdropFilter,
        borderTop: premiumDesign.glass.dark.border,
        boxShadow: premiumDesign.effects.shadow['2xl'],
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon

            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center space-y-1 py-2 px-3 rounded-xl transition-all relative"
                style={{
                  color: isActive ? premiumDesign.colors.primary[400] : premiumDesign.colors.neutral[400],
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `${premiumDesign.colors.primary[500]}20`,
                      border: `1px solid ${premiumDesign.colors.primary[500]}40`,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                <Icon
                  size={24}
                  className="relative z-10"
                  strokeWidth={isActive ? 2.5 : 2}
                />

                <span
                  className="text-xs font-medium relative z-10"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.label}
                </span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.nav>
  )
}