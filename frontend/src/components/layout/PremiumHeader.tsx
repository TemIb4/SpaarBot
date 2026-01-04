import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Bell, User, LogOut, CreditCard,
  Shield, ChevronDown, TrendingUp, Sparkles
} from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

export const PremiumHeader = () => {
  const { user, isPremium, logout } = useUserStore()
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadNotifications] = useState(3)

  const menuItems = [
    { icon: Sparkles, label: isPremium ? t('menu.premium_active') : t('menu.upgrade'), action: () => navigate('/upgrade'), highlight: !isPremium, badge: !isPremium ? 'NEU' : null },
    { icon: User, label: t('menu.profile'), action: () => navigate('/profile') },
    { icon: Settings, label: t('menu.settings'), action: () => navigate('/settings') },
    { icon: Bell, label: t('menu.notifications'), action: () => navigate('/notifications'), badge: unreadNotifications > 0 ? unreadNotifications : null },
    { icon: CreditCard, label: t('menu.payment_methods'), action: () => navigate('/payment-methods') },
    { icon: Shield, label: t('menu.security'), action: () => navigate('/security') },
    { icon: TrendingUp, label: t('menu.usage_stats'), action: () => navigate('/usage-stats') },
    { icon: LogOut, label: t('menu.logout'), action: () => { if (window.confirm(t('menu.logout_confirm'))) { logout(); navigate('/'); } }, danger: true, separator: true }
  ]

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 left-0 right-0 z-[60] flex flex-col justify-end shadow-2xl"
        style={{
          height: 'var(--header-total-height)',
          background: 'rgba(8, 8, 8, 0.90)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: 'var(--sat)',
        }}
      >
        <div
          className="w-full h-[var(--header-content-height)] flex items-center justify-between pl-3 pr-2"
          // Больше отступа справа для кнопок Telegram
          style={{ paddingRight: '80px' }}
        >
          {/* LEFT SIDE: Logo */}
          <div
            className="flex items-center space-x-2 cursor-pointer select-none active:opacity-70 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-indigo-500/20 border border-white/10"
              style={{ background: premiumDesign.colors.gradients.primary }}
            >
              💎
            </div>
            <h1 className="text-base font-bold tracking-tight text-white font-display">
              SpaarBot
            </h1>
          </div>

          {/* RIGHT SIDE: Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center p-1.5 pl-2.5 rounded-xl hover:bg-white/5 active:scale-95 transition-all gap-1.5"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/10 shadow-sm"
                  style={{ background: premiumDesign.colors.gradients.accent, color: '#fff' }}
                >
                  {user?.first_name?.[0] || 'U'}
                </div>
                <ChevronDown size={14} className={`text-neutral-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-50 origin-top-right bg-[#151515] border border-neutral-800 shadow-2xl"
                    >
                      <div className="p-2 space-y-1">
                        {menuItems.map((item, index) => (
                          <div key={index}>
                            {item.separator && <div className="my-1.5 mx-2 h-px bg-white/10" />}
                            <button
                              onClick={() => { item.action(); setShowUserMenu(false); }}
                              className={`w-full px-3 py-3 flex items-center justify-between rounded-xl transition-all active:scale-[0.98] ${
                                item.highlight ? 'bg-indigo-600/10' : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <item.icon size={18} className={item.danger ? "text-red-400" : item.highlight ? "text-indigo-400" : "text-neutral-400"} />
                                <span className={`text-sm font-medium ${item.danger ? "text-red-400" : "text-neutral-200"}`}>{item.label}</span>
                              </div>
                              {item.badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500 text-white">{item.badge}</span>}
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  )
}