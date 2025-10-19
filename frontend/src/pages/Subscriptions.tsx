/**
 * Subscriptions Page with Optimized Animations
 */
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { usePageVisited } from '@/hooks/usePageVisited' // ✅ Добавили
import { formatCurrency } from '@/utils/formatters'

const mockSubscriptions = [
  {
    id: 1,
    name: 'Netflix',
    amount: 12.99,
    icon: '🎬',
    color: '#E50914',
    frequency: 'Monatlich',
    nextPayment: '2025-10-25',
  },
  {
    id: 2,
    name: 'Spotify',
    amount: 9.99,
    icon: '🎵',
    color: '#1DB954',
    frequency: 'Monatlich',
    nextPayment: '2025-10-20',
  },
  {
    id: 3,
    name: 'Fitness Studio',
    amount: 29.90,
    icon: '💪',
    color: '#FF6B6B',
    frequency: 'Monatlich',
    nextPayment: '2025-11-01',
  },
]

export const Subscriptions: React.FC = () => {
  const { shouldAnimate } = usePageVisited() // ✅ Добавили
  const totalMonthly = mockSubscriptions.reduce((sum, sub) => sum + sub.amount, 0)
  const totalYearly = totalMonthly * 12

  // ✅ Настройки анимации
  const animationVariants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { opacity: 1, y: 0 },
  }
  const animationDuration = shouldAnimate ? 0.2 : 0

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
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
          📅 Abonnements
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Verwalte deine wiederkehrenden Ausgaben
        </p>
      </motion.div>

      <div className="px-4 space-y-4 relative">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.05 : 0 }}
          >
            <Card
              padding="md"
              className="shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              }}
            >
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                Pro Monat
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalMonthly)}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                {mockSubscriptions.length} Abos
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.05 : 0 }}
          >
            <Card
              padding="md"
              className="shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
              }}
            >
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                Pro Jahr
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalYearly)}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                Hochgerechnet
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Add Subscription Button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.1 : 0 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => alert('Abo hinzufügen - Feature kommt bald!')}
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
              color: 'var(--color-text)',
            }}
          >
            ➕ Neues Abo hinzufügen
          </Button>
        </motion.div>

        {/* Subscriptions List */}
        <div className="space-y-3">
          {mockSubscriptions.map((sub, index) => {
            const daysUntil = getDaysUntil(sub.nextPayment)
            const isUpcoming = daysUntil <= 7

            return (
              <motion.div
                key={sub.id}
                initial="hidden"
                animate="visible"
                variants={animationVariants}
                transition={{ duration: animationDuration, delay: shouldAnimate ? 0.15 + index * 0.05 : 0 }}
              >
                <Card
                  padding="md"
                  className={`${isUpcoming ? 'border-2' : ''}`}
                  style={{
                    backgroundColor: 'var(--color-card)',
                    borderColor: isUpcoming ? 'var(--color-accent)' : 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg"
                        style={{ backgroundColor: sub.color + '30' }}
                      >
                        {sub.icon}
                      </div>
                      <div>
                        <p className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                          {sub.name}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {sub.frequency}
                        </p>
                        <p
                          className="text-xs mt-1 font-medium"
                          style={{ color: isUpcoming ? 'var(--color-accent)' : 'var(--color-text-secondary)' }}
                        >
                          {isUpcoming && '⚠️ '}
                          {daysUntil === 0 ? 'Heute' : daysUntil === 1 ? 'Morgen' : `in ${daysUntil} Tagen`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold" style={{ color: sub.color }}>
                        {formatCurrency(sub.amount)}
                      </p>
                      <button
                        onClick={() => alert(`${sub.name} verwalten`)}
                        className="text-xs hover:underline mt-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Verwalten
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Tips Card */}
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
              borderColor: 'var(--color-accent)',
            }}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="font-bold mb-1" style={{ color: 'var(--color-text)' }}>
                  Spar-Tipp
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Du gibst {formatCurrency(totalMonthly)} pro Monat für Abos aus.
                  Prüfe regelmäßig, ob du alle noch nutzt!
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}