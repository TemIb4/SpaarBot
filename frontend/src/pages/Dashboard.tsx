/**
 * Dashboard Page - Optimized animations
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useTransactions } from '@/hooks/useTransactions'
import { useUIStore } from '@/store/uiStore'
import { usePageVisited } from '@/hooks/usePageVisited'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AddTransactionModal } from '@/components/modals/AddTransactionModal'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { ExpenseChart } from '@/components/charts/ExpenseChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { TransactionList } from '@/components/transactions/TransactionList'
import { formatCurrency } from '@/utils/formatters'

const datePresets = [
  { label: 'Woche', value: 'week', days: 7 },
  { label: 'Monat', value: 'month', days: 30 },
  { label: 'Jahr', value: 'year', days: 365 },
]

export const Dashboard: React.FC = () => {
  useAuth() // Переменная 'user' была удалена, так как не использовалась
  const { transactions, categoryBreakdown, totalExpenses, totalIncome, isLoading } = useTransactions()
  const { setDateRange } = useUIStore()
  const { shouldAnimate } = usePageVisited()

  const [activePreset, setActivePreset] = useState<string>('month')
  const [isAddingTransaction, setIsAddingTransaction] = useState(false)

  const handlePresetChange = (presetValue: string, days: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - days)

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })

    setActivePreset(presetValue)
  }

  const balance = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0

  const animationVariants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { opacity: 1, y: 0 },
  }

  const animationDuration = shouldAnimate ? 0.2 : 0

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              SpaarBot
            </h1>
          </div>
          <div className="text-right">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Saldo
            </p>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
              {formatCurrency(balance)}
            </p>
            <p className="text-xs" style={{ color: balance >= 0 ? '#10b981' : '#ef4444' }}>
              {balance >= 0 ? '▲' : '▼'} {savingsRate}% Sparquote
            </p>
          </div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex gap-2 mt-4">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePresetChange(preset.value, preset.days)}
              className="flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: activePreset === preset.value ? 'var(--color-card-hover)' : 'var(--color-card)',
                color: 'var(--color-text)',
                border: `2px solid ${activePreset === preset.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main Content */}
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
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  📊
                </div>
                <div>
                  <p className="text-xs opacity-90" style={{ color: 'var(--color-text)' }}>
                    Ausgaben
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {formatCurrency(totalExpenses)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.1 : 0 }}
          >
            <Card
              padding="md"
              className="shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--color-accent), var(--color-primary))`,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl shadow-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                >
                  💰
                </div>
                <div>
                  <p className="text-xs opacity-90" style={{ color: 'var(--color-text)' }}>
                    Einnahmen
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    {formatCurrency(totalIncome)}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Add Transaction Button */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.15 : 0 }}
        >
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setIsAddingTransaction(true)}
            className="py-4 text-lg font-semibold shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
              color: 'var(--color-text)',
            }}
          >
            ➕ Neue Ausgabe hinzufügen
          </Button>
        </motion.div>

        {/* Quick Stats */}
        {!isLoading && transactions.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.2 : 0 }}
          >
            <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                📊 Schnellübersicht
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-card-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Ø pro Tag
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {formatCurrency(totalExpenses / 30)}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-card-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Transaktionen
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {transactions.length}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-card-hover)' }}>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    Kategorien
                  </p>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>
                    {categoryBreakdown.length}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Expense Trend Chart */}
        {!isLoading && transactions.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.25 : 0 }}
          >
            <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                📈 Ausgaben-Trend
              </h3>
              <ExpenseChart transactions={transactions} />
            </Card>
          </motion.div>
        )}

        {/* Category Breakdown */}
        {!isLoading && categoryBreakdown.length > 0 && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.3 : 0 }}
          >
            <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                🥧 Top Kategorien
              </h3>
              <CategoryPieChart data={categoryBreakdown} />
            </Card>
          </motion.div>
        )}

        {/* Recent Transactions */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.35 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                📝 Letzte Transaktionen
              </h3>
              {transactions.length > 10 && (
                <button
                  className="text-sm hover:underline"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Alle ansehen
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <div
                  className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto mb-2"
                  style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
                ></div>
                Lädt...
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-4xl mb-2">📭</p>
                <p>Noch keine Transaktionen</p>
                <p className="text-sm mt-1">Füge deine erste Ausgabe hinzu!</p>
              </div>
            ) : (
              <TransactionList transactions={transactions.slice(0, 10)} />
            )}
          </Card>
        </motion.div>
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddingTransaction}
        onClose={() => setIsAddingTransaction(false)}
      />
    </div>
  )
}