import { motion } from 'framer-motion'
import { Globe, Palette, Zap, Check } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useLanguage } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'
import { useUIMode } from '../contexts/UIModeContext'
import { useNavigate } from 'react-router-dom'

const Settings = () => {
  const { isPremium } = useUserStore()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme, availableThemes } = useTheme()
  const { uiMode, setUIMode } = useUIMode()
  const navigate = useNavigate()

  const languages = [
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'uk', name: 'Українська', flag: '🇺🇦' },
  ]

  const uiModes = [
    { value: 'pro', label: 'Pro', icon: Zap, description: t('pro_desc') },
    { value: 'lite', label: 'Lite', icon: Zap, description: t('lite_desc') },
  ]

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('settings.title')}</h1>
          <p className="text-neutral-400">
            {t('settings.adjust_settings')}
          </p>
        </div>

        {/* Premium Banner */}
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
                    {t('premium.upgrade')}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {t('premium.unlimited_features_text')}
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
              <p className="text-sm text-neutral-400">{t('settings.language_subtitle')}</p>
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
                  onClick={() => {
                    console.log('🌍 Changing language to:', lang.code)
                    setLanguage(lang.code)
                  }}
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
              <h2 className="text-xl font-bold text-white">{t('settings.theme_title')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.theme_subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {availableThemes.map((themeItem) => {
              const isActive = theme === themeItem.id
              const isLocked = themeItem.premium && !isPremium

              return (
                <motion.button
                  key={themeItem.id}
                  whileHover={{ scale: isLocked ? 1 : 1.02 }}
                  whileTap={{ scale: isLocked ? 1 : 0.98 }}
                  onClick={() => {
                    if (!isLocked) {
                      console.log('🎨 Changing theme to:', themeItem.id)
                      setTheme(themeItem.id)
                    }
                  }}
                  disabled={isLocked}
                  className="w-full p-4 rounded-xl text-left transition-all"
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-10 h-10 rounded-lg"
                        style={{ background: themeItem.preview }}
                      />
                      <div>
                        <div className="font-semibold text-white flex items-center space-x-2">
                          <span>{themeItem.name}</span>
                          {isLocked && <span className="text-xs">🔒</span>}
                        </div>
                        <div className="text-xs text-neutral-500">{themeItem.description}</div>
                      </div>
                    </div>
                    {isActive && (
                      <Check size={20} className="text-primary-400" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* UI Mode Settings */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
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
                background: `${premiumDesign.colors.success[500]}20`,
                border: `1px solid ${premiumDesign.colors.success[500]}40`,
              }}
            >
              <Zap size={24} className="text-success-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('settings.ui_mode_title')}</h2>
              <p className="text-sm text-neutral-400">{t('settings.ui_mode_subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {uiModes.map((mode) => {
              const isActive = uiMode === mode.value

              return (
                <motion.button
                  key={mode.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    console.log('📱 Changing UI mode to:', mode.value)
                    setUIMode(mode.value as 'pro' | 'lite')
                  }}
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
                  <div className="flex items-center justify-between mb-2">
                    <mode.icon
                      size={24}
                      style={{
                        color: isActive
                          ? '#fff'
                          : premiumDesign.colors.neutral[500]
                      }}
                    />
                    {isActive && (
                      <Check size={20} className="text-white" />
                    )}
                  </div>
                  <div className="font-semibold text-white mb-1">{mode.label}</div>
                  <div className="text-xs text-neutral-500">{mode.description}</div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Settings