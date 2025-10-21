import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Bell, Calendar, User, LogOut, CreditCard,
  Shield, ChevronDown, TrendingUp, Sparkles
} from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'
import { CalendarPopup } from './CalendarPopup'

export const PremiumHeader: React.FC = () => {
  const { user, isPremium, logout } = useUserStore()
  const navigate = useNavigate()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [unreadNotifications] = useState(3)

  const menuItems = [
    {
      icon: Sparkles,
      label: isPremium ? 'SpaarBot Premium' : 'Upgrade to Premium',
      action: () => navigate('/upgrade'),
      highlight: !isPremium,
      badge: !isPremium ? 'NEW' : null
    },
    {
      icon: User,
      label: 'Персональные данные',
      action: () => navigate('/profile')
    },
    {
      icon: Settings,
      label: 'Настройки',
      action: () => navigate('/settings')
    },
    {
      icon: Bell,
      label: 'Уведомления',
      action: () => navigate('/notifications'),
      badge: unreadNotifications > 0 ? unreadNotifications : null
    },
    {
      icon: CreditCard,
      label: 'Способы оплаты',
      action: () => navigate('/payment-methods')
    },
    {
      icon: Shield,
      label: 'Безопасность',
      action: () => navigate('/security')
    },
    {
      icon: TrendingUp,
      label: 'Статистика использования',
      action: () => navigate('/usage-stats')
    },
    {
      icon: LogOut,
      label: 'Выйти из аккаунта',
      action: logout,
      danger: true,
      separator: true
    }
  ]

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
      style={{
        background: premiumDesign.glass.dark.background,
        backdropFilter: premiumDesign.glass.dark.backdropFilter,
        borderBottom: premiumDesign.glass.dark.border,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.div
          className="flex items-center space-x-3 cursor-pointer"
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate('/')}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            💎
          </div>
          <div>
            <h1
              className="text-xl font-bold"
              style={{
                fontFamily: premiumDesign.typography.fontFamily.display,
                background: premiumDesign.colors.gradients.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              SpaarBot
            </h1>
            {isPremium && (
              <span className="text-xs text-yellow-400 font-semibold">
                ✨ Premium
              </span>
            )}
          </div>
        </motion.div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Calendar Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCalendar(!showCalendar)}
            className="relative p-2.5 rounded-xl transition-all"
            style={{
              background: showCalendar
                ? premiumDesign.colors.primary[500]
                : premiumDesign.glass.light.background,
              border: premiumDesign.glass.light.border,
              color: showCalendar ? '#fff' : premiumDesign.colors.neutral[300],
            }}
          >
            <Calendar size={20} />
            {/* Indicator for upcoming subscriptions */}
            <span
              className="absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse"
              style={{ background: premiumDesign.colors.warning[500] }}
            />
          </motion.button>

          {/* User Menu */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl transition-all"
              style={{
                background: showUserMenu
                  ? premiumDesign.colors.primary[500]
                  : premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: premiumDesign.colors.gradients.accent,
                  color: '#fff',
                }}
              >
                {user?.first_name?.[0] || 'U'}
              </div>
              <span className="text-sm font-medium hidden sm:block text-white">
                {user?.first_name || 'User'}
              </span>
              <ChevronDown
                size={16}
                className="text-neutral-400 transition-transform"
                style={{
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-72 rounded-2xl overflow-hidden"
                  style={{
                    background: premiumDesign.colors.neutral[900],
                    border: `1px solid ${premiumDesign.colors.neutral[800]}`,
                    boxShadow: premiumDesign.effects.shadow['2xl'],
                  }}
                >
                  {/* User Info Header */}
                  <div
                    className="p-4 border-b"
                    style={{
                      borderColor: premiumDesign.colors.neutral[800],
                      background: premiumDesign.glass.dark.background,
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          background: premiumDesign.colors.gradients.primary,
                        }}
                      >
                        {user?.first_name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">
                          {user?.first_name || 'User'}
                        </p>
                        <p className="text-sm text-neutral-400 truncate">
                          @{user?.username || 'username'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    {menuItems.map((item, index) => (
                      <React.Fragment key={index}>
                        {item.separator && (
                          <div
                            className="my-2 h-px"
                            style={{ background: premiumDesign.colors.neutral[800] }}
                          />
                        )}
                        <motion.button
                          whileHover={{ x: 4 }}
                          onClick={() => {
                            item.action()
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between transition-colors"
                          style={{
                            color: item.danger
                              ? premiumDesign.colors.danger[400]
                              : premiumDesign.colors.neutral[300],
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = premiumDesign.glass.light.background
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon size={18} />
                            <span className="text-sm font-medium">
                              {item.label}
                            </span>
                          </div>
                          {item.badge && (
                            <span
                              className="px-2 py-0.5 text-xs font-bold rounded-full"
                              style={{
                                background: item.highlight
                                  ? premiumDesign.colors.gradients.premium
                                  : premiumDesign.colors.primary[500],
                                color: '#fff',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </motion.button>
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Calendar Popup */}
      <AnimatePresence>
        {showCalendar && (
          <CalendarPopup onDateSelect={(date) => {
            console.log('Selected date:', date)
            setShowCalendar(false)
          }} />
        )}
      </AnimatePresence>
    </motion.header>
  )
}