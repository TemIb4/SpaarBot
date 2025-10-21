import { Home, BarChart3, Calendar, Settings as SettingsIcon, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { premiumDesign } from '../../config/premiumDesign'

export const BottomNav = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/ai', icon: Sparkles, label: 'AI' },
    { path: '/stats', icon: BarChart3, label: 'Stats' },
    { path: '/subscriptions', icon: Calendar, label: 'Abos' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: premiumDesign.colors.neutral[900],
        borderTop: `1px solid ${premiumDesign.colors.neutral[800]}`,
      }}
    >
      <div className="flex items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link key={item.path} to={item.path}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center space-y-1"
              >
                <div
                  className="p-2 rounded-xl transition-colors"
                  style={{
                    background: isActive
                      ? `${premiumDesign.colors.primary[500]}20`
                      : 'transparent',
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      color: isActive
                        ? premiumDesign.colors.primary[400]
                        : premiumDesign.colors.neutral[500],
                    }}
                  />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isActive
                      ? premiumDesign.colors.primary[400]
                      : premiumDesign.colors.neutral[500],
                  }}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}