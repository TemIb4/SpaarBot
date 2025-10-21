// src/pages/Settings.tsx

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Globe, Palette, Zap, Bell,
  Smartphone, Monitor, ChevronRight, Crown,
  Info, HelpCircle, FileText, Shield
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useUIMode } from '../contexts/UIModeContext'
import { useNavigate } from 'react-router-dom'

const Settings: React.FC = () => {
  const { isPremium } = useUserStore()
  const { language, setLanguage } = useLanguage()
  const { theme, setTheme, availableThemes } = useTheme()
  const { uiMode, setUIMode } = useUIMode()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState({
    subscriptions: true,
    budgetAlerts: true,
    weeklyReports: false,
    aiInsights: true,
  })

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  ]

  const uiModes = [
    { value: 'pro', label: 'Pro', icon: Zap, description: 'Alle Features, Grafiken & AI' },
    { value: 'lite', label: 'Lite', icon: Smartphone, description: 'Einfach & minimalistisch' },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Einstellungen</h1>
          <p className="text-neutral-400">
            Passe SpaarBot an deine Bedürfnisse an
          </p>
        </div>

        {!isPremium && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6 mb-8 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/upgrade')}
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `2px solid ${premiumDesign.colors.primary[500]}`,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                    boxShadow: premiumDesign.effects.shadow.glow,
                  }}
                >
                  👑
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Upgrade auf Premium
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Unbegrenzte Features für nur 3,99€/Monat
                  </p>
                </div>
              </div>
              <ChevronRight size={24} className="text-neutral-400" />
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${premiumDesign.colors.primary[500]}20`,
                border: `1px solid ${premiumDesign.colors.primary[500]}40`,
              }}
            >
              <Globe size={24} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Sprache</h2>
              <p className="text-sm text-neutral-400">Wähle deine bevorzugte Sprache</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setLanguage(lang.code as any)}
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  background: language === lang.code
                    ? premiumDesign.glass.medium.background
                    : premiumDesign.glass.light.background,
                  border: language === lang.code
                    ? `2px solid ${premiumDesign.colors.primary[500]}`
                    : premiumDesign.glass.light.border,
                }}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-white">{lang.name}</div>
                    <div className="text-xs text-neutral-500">{lang.code.toUpperCase()}</div>
                  </div>
                  {language === lang.code && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: premiumDesign.colors.primary[500] }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${premiumDesign.colors.accent[500]}20`,
                border: `1px solid ${premiumDesign.colors.accent[500]}40`,
              }}
            >
              <Palette size={24} className="text-accent-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Farbschema</h2>
              <p className="text-sm text-neutral-400">Wähle dein bevorzugtes Theme</p>
            </div>
          </div>

          <div className="space-y-3">
            {availableThemes.map((t) => (
              <motion.button
                key={t.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setTheme(t.id)}
                className="w-full p-4 rounded-xl text-left transition-all"
                style={{
                  background: theme === t.id
                    ? premiumDesign.glass.medium.background
                    : premiumDesign.glass.light.background,
                  border: theme === t.id
                    ? `2px solid ${premiumDesign.colors.primary[500]}`
                    : premiumDesign.glass.light.border,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg"
                      style={{ background: t.preview }}
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center space-x-2">
                        <span>{t.name}</span>
                        {t.premium && !isPremium && (
                          <Crown size={14} className="text-yellow-400" />
                        )}
                      </div>
                      <div className="text-xs text-neutral-500">{t.description}</div>
                    </div>
                  </div>
                  {theme === t.id && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: premiumDesign.colors.primary[500] }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${premiumDesign.colors.success[500]}20`,
                border: `1px solid ${premiumDesign.colors.success[500]}40`,
              }}
            >
              <Monitor size={24} className="text-success-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Anzeigemodus</h2>
              <p className="text-sm text-neutral-400">Passe die Komplexität an</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {uiModes.map((mode) => (
              <motion.button
                key={mode.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setUIMode(mode.value as any)}
                className="p-4 rounded-xl text-left transition-all"
                style={{
                  background: uiMode === mode.value
                    ? premiumDesign.glass.medium.background
                    : premiumDesign.glass.light.background,
                  border: uiMode === mode.value
                    ? `2px solid ${premiumDesign.colors.primary[500]}`
                    : premiumDesign.glass.light.border,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <mode.icon
                    size={24}
                    style={{
                      color: uiMode === mode.value
                        ? premiumDesign.colors.primary[400]
                        : premiumDesign.colors.neutral[500]
                    }}
                  />
                  {uiMode === mode.value && (
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: premiumDesign.colors.primary[500] }}
                    >
                      ✓
                    </div>
                  )}
                </div>
                <div className="font-semibold text-white mb-1">{mode.label}</div>
                <div className="text-xs text-neutral-500">{mode.description}</div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-3xl p-6 mb-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: `${premiumDesign.colors.warning[500]}20`,
                border: `1px solid ${premiumDesign.colors.warning[500]}40`,
              }}
            >
              <Bell size={24} className="text-warning-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Benachrichtigungen</h2>
              <p className="text-sm text-neutral-400">Verwalte deine Benachrichtigungen</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'subscriptions', label: 'Abo-Erinnerungen', description: 'Erinnere mich vor Abbuchungen' },
              { key: 'budgetAlerts', label: 'Budget-Warnungen', description: 'Benachrichtige bei Überschreitung' },
              { key: 'weeklyReports', label: 'Wöchentliche Berichte', description: 'Zusammenfassung per E-Mail' },
              { key: 'aiInsights', label: 'AI Insights', description: 'Intelligente Finanz-Tipps', premium: true },
            ].map((setting) => (
              <div
                key={setting.key}
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{setting.label}</span>
                    {setting.premium && !isPremium && (
                      <Crown size={14} className="text-yellow-400" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">{setting.description}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setNotifications({
                    ...notifications,
                    [setting.key]: !notifications[setting.key as keyof typeof notifications]
                  })}
                  disabled={setting.premium && !isPremium}
                  className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:opacity-50"
                  style={{
                    background: notifications[setting.key as keyof typeof notifications]
                      ? premiumDesign.colors.primary[500]
                      : premiumDesign.colors.neutral[700],
                  }}
                >
                  <span
                    className="inline-block h-6 w-6 transform rounded-full bg-white transition-transform"
                    style={{
                      transform: notifications[setting.key as keyof typeof notifications]
                        ? 'translateX(2rem)'
                        : 'translateX(0.25rem)',
                    }}
                  />
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl p-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Weitere Optionen</h2>

          <div className="space-y-2">
            {[
              { icon: Shield, label: 'Sicherheit & Privatsphäre', route: '/security' },
              { icon: HelpCircle, label: 'Hilfe & Support', route: '/help' },
              { icon: FileText, label: 'Datenschutz & AGB', route: '/legal' },
              { icon: Info, label: 'Über SpaarBot', route: '/about' },
            ].map((item) => (
              <motion.button
                key={item.route}
                whileHover={{ x: 4 }}
                onClick={() => navigate(item.route)}
                className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-colors"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = premiumDesign.glass.medium.background
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = premiumDesign.glass.light.background
                }}
              >
                <div className="flex items-center space-x-3">
                  <item.icon size={20} className="text-neutral-400" />
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-neutral-500" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="text-center mt-8 text-neutral-500 text-sm">
          SpaarBot v1.0.0 • Made with 💎 in Germany
        </div>
      </motion.div>
    </div>
  )
}

export default Settings