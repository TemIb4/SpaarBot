// Settings.tsx - БЕЗ АНИМАЦИЙ И UI MODE

import { motion } from 'framer-motion'
import { Globe, Palette, Check, FileText } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
  const { isPremium } = useUserStore()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme, availableThemes } = useTheme()
  const navigate = useNavigate()

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('settings.title')}</h1>
          <p className="text-neutral-400">{t('settings.adjust_settings')}</p>
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
                    {t('upgrade.title')}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {t('upgrade.description')}
                  </p>
                </div>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </motion.div>
        )}

        {/* Language Settings */}
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
              <h2 className="text-xl font-bold text-white">{t('settings.language_title')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.choose_language')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {languages.map((lang) => {
              const isActive = language === lang.code

              return (
                <motion.button
                  key={lang.code}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLanguage(lang.code)}
                  className="p-4 rounded-xl text-left transition-all"
                  style={{
                    background: isActive
                      ? premiumDesign.colors.gradients.primary
                      : premiumDesign.glass.light.background,
                    border: isActive
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
                    {isActive && (
                      <Check size={20} className="text-white" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-6"
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
              <h2 className="text-xl font-bold text-white">{t('settings.theme_title')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.choose_theme')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableThemes.map((themeOption) => {
              const isActive = theme === themeOption.id
              const isLocked = themeOption.premium && !isPremium

              return (
                <motion.button
                  key={themeOption.id}
                  whileHover={{ scale: isLocked ? 1 : 1.05 }}
                  whileTap={{ scale: isLocked ? 1 : 0.95 }}
                  onClick={() => {
                    if (!isLocked) {
                      setTheme(themeOption.id)
                    }
                  }}
                  disabled={isLocked}
                  className="relative p-4 rounded-xl text-center transition-all"
                  style={{
                    background: isActive
                      ? premiumDesign.glass.medium.background
                      : premiumDesign.glass.light.background,
                    border: isActive
                      ? `2px solid ${premiumDesign.colors.primary[500]}`
                      : premiumDesign.glass.light.border,
                    opacity: isLocked ? 0.5 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div
                    className="w-full h-20 rounded-lg mb-3"
                    style={{ background: themeOption.preview }}
                  />
                  <div className="font-semibold text-white text-sm mb-1">
                    {themeOption.name}
                    {isLocked && ' 🔒'}
                  </div>
                  <div className="text-xs text-neutral-500">{themeOption.description}</div>
                  {isActive && (
                    <div className="absolute top-2 right-2">
                      <Check size={20} className="text-primary-400" />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Logs Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl overflow-hidden mt-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <button
            onClick={() => navigate('/logs')}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-all"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.accent[500]}20`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                }}
              >
                <FileText size={24} className="text-accent-400" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-white">Просмотр логов</h3>
                <p className="text-sm text-neutral-400">Отладка и диагностика</p>
              </div>
            </div>
            <div className="text-2xl text-neutral-600">→</div>
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Settings