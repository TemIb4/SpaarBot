/**
 * Settings Page with Theme Selector
 */
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ThemeSelector } from '@/components/settings/ThemeSelector'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { useAuth } from '@/hooks/useAuth'
import { useTelegram } from '@/hooks/useTelegram'
import { APP_NAME, APP_VERSION } from '@/utils/constants'
import { usePageVisited } from '@/hooks/usePageVisited' // ИСПРАВЛЕНО: Добавлен импорт

export const Settings: React.FC = () => {
  const { user } = useAuth()
  const { webApp } = useTelegram()
  const { shouldAnimate } = usePageVisited() // ИСПРАВЛЕНО: Добавлен хук

  // ИСПРАВЛЕНО: Теперь эти переменные используются в JSX ниже
  const animationVariants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { opacity: 1, y: 0 },
  }
  const animationDuration = shouldAnimate ? 0.2 : 0

  const handleExportData = () => {
    webApp?.showAlert('Export-Funktion kommt bald!')
  }

  const handleDeleteAccount = () => {
    webApp?.showConfirm(
      'Möchtest du wirklich dein Konto löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
      (confirmed: boolean) => {
        if (confirmed) {
          webApp?.showAlert('Konto-Löschung wird implementiert')
        }
      }
    )
  }

  return (
    <div className="min-h-screen pb-24 relative">
      <AnimatedBackground />

      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={animationVariants}
        transition={{ duration: animationDuration }}
        className="relative p-6 pb-8"
      >
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
          ⚙️ Einstellungen
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Personalisiere deine App
        </p>
      </motion.div>

      <div className="px-4 space-y-4 relative">
        {/* User Profile */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.1 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              👤 Benutzerprofil
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>Name</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {user?.first_name || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>Telegram ID</span>
                <span className="font-medium font-mono text-sm" style={{ color: 'var(--color-text)' }}>
                  {user?.telegram_id || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>Plan</span>
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-text)'
                  }}
                >
                  {user?.tier === 'premium' ? '💎 Premium' : '🆓 Free'}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Theme Selector */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.2 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              🎨 Цветовая тема
            </h2>
            <ThemeSelector />
          </Card>
        </motion.div>

        {/* Premium Upgrade */}
        {user?.tier === 'free' && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.3 : 0 }}
          >
            <Card
              padding="md"
              className="border-2"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-accent)'
              }}
            >
              <div className="text-center py-4">
                <div className="text-5xl mb-3">💎</div>
                <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
                  Upgrade auf Premium
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  Unbegrenzte Transaktionen, KI-Analysen und mehr!
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
                    color: 'var(--color-text)'
                  }}
                >
                  Jetzt upgraden - 1 Monat gratis
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Data Management */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.4 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              📦 Datenverwaltung
            </h2>
            <div className="space-y-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={handleExportData}
                style={{
                  backgroundColor: 'var(--color-card-hover)',
                  color: 'var(--color-text)'
                }}
              >
                📥 Daten exportieren
              </Button>

              <Button
                variant="danger"
                fullWidth
                onClick={handleDeleteAccount}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                🗑️ Konto löschen
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* App Info */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.5 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              ℹ️ Über die App
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>Version</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {APP_VERSION}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--color-text-secondary)' }}>App Name</span>
                <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {APP_NAME}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Made with ❤️ für besseres Geldmanagement
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                © 2025 SpaarBot. Alle Rechte vorbehalten.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}