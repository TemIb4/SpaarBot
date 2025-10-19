/**
 * Theme Selector Component
 */
import { motion } from 'framer-motion'
import { useTheme } from '@/context/ThemeContext'

export const ThemeSelector: React.FC = () => {
  const { currentTheme, setTheme, availableThemes } = useTheme()

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        Выбери цветовую схему
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {availableThemes.map((theme, index) => {
          const isActive = currentTheme.id === theme.id

          return (
            <motion.button
              key={theme.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTheme(theme.id)}
              className={`relative overflow-hidden rounded-2xl p-4 transition-all ${
                isActive ? 'ring-4 ring-offset-2' : ''
              }`}
              style={{
                background: `linear-gradient(135deg, ${theme.gradient.from}, ${theme.gradient.via}, ${theme.gradient.to})`,
                ...(isActive && {
                  boxShadow: `0 0 0 4px ${theme.colors.accent}`,
                }),
              }}
            >
              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTheme"
                  className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                >
                  <span className="text-sm">✓</span>
                </motion.div>
              )}

              {/* Theme Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{theme.emoji}</span>
                </div>
                <p
                  className="text-sm font-bold text-left"
                  style={{ color: theme.colors.text }}
                >
                  {theme.name}
                </p>

                {/* Color Dots */}
                <div className="flex gap-1 mt-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.secondary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: theme.colors.accent }}
                  />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}