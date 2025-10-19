/**
 * Stats Page - Detailed Analytics with Optimized Animations
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTransactions } from '@/hooks/useTransactions'
import { useUIStore } from '@/store/uiStore'
import { usePageVisited } from '@/hooks/usePageVisited' // ✅ Добавили
import { Card } from '@/components/ui/Card'
import { Dropdown } from '@/components/ui/Dropdown'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { ExpenseChart } from '@/components/charts/ExpenseChart'
import { CategoryPieChart } from '@/components/charts/CategoryPieChart'
import { MonthlyComparisonChart } from '@/components/charts/MonthlyComparisonChart'
import { WeeklyTrendChart } from '@/components/charts/WeeklyTrendChart'
import { formatCurrency } from '@/utils/formatters'

const timeframeOptions = [
  { label: 'Heute', value: 1, icon: '📅' },
  { label: 'Letzte 7 Tage', value: 7, icon: '📊' },
  { label: 'Letzte 15 Tage', value: 15, icon: '📈' },
  { label: 'Letzter Monat', value: 30, icon: '🗓️' },
  { label: 'Letzte 3 Monate', value: 90, icon: '📆' },
  { label: 'Letzte 6 Monate', value: 180, icon: '🗂️' },
  { label: 'Letztes Jahr', value: 365, icon: '📚' },
]

export const Stats: React.FC = () => {
  const { transactions, categoryBreakdown, totalExpenses, totalIncome } = useTransactions()
  const { setDateRange } = useUIStore()
  const { shouldAnimate } = usePageVisited() // ✅ Добавили
  const [activeTimeframe, setActiveTimeframe] = useState(30)

  // ✅ Настройки анимации
  const animationVariants = {
    hidden: { opacity: 0, y: shouldAnimate ? 20 : 0 },
    visible: { opacity: 1, y: 0 },
  }
  const animationDuration = shouldAnimate ? 0.2 : 0

  const handleTimeframeChange = (days: number | string) => {
    const daysNum = Number(days)
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - daysNum)

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    })
    setActiveTimeframe(daysNum)
  }

  const expenses = transactions.filter(t => t.transaction_type === 'expense')
  const avgExpensePerDay = expenses.length > 0 ? totalExpenses / activeTimeframe : 0
  const biggestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0
  const transactionCount = expenses.length
  const balance = totalIncome - totalExpenses

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
          📊 Statistiken
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Detaillierte Finanzanalyse
        </p>
      </motion.div>

      <div className="px-4 space-y-4 relative">
        {/* Timeframe Selector Dropdown */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.05 : 0 }}
        >
          <Dropdown
            options={timeframeOptions}
            value={activeTimeframe}
            onChange={handleTimeframeChange}
            placeholder="Zeitraum wählen"
          />
        </motion.div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
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
                background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`,
              }}
            >
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                💸 Ausgaben
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                Ø {formatCurrency(avgExpensePerDay)}/Tag
              </p>
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
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                💰 Einnahmen
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                Saldo: {formatCurrency(balance)}
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.15 : 0 }}
          >
            <Card
              padding="md"
              className="shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--color-secondary), var(--color-accent))`,
              }}
            >
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                📝 Transaktionen
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {transactionCount}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                im Zeitraum
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={animationVariants}
            transition={{ duration: animationDuration, delay: shouldAnimate ? 0.15 : 0 }}
          >
            <Card
              padding="md"
              className="shadow-lg"
              style={{
                background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-to))`,
              }}
            >
              <p className="text-xs opacity-90 mb-1" style={{ color: 'var(--color-text)' }}>
                🔝 Größte Ausgabe
              </p>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                {formatCurrency(biggestExpense)}
              </p>
              <p className="text-xs opacity-75 mt-1" style={{ color: 'var(--color-text)' }}>
                Einzeltransaktion
              </p>
            </Card>
          </motion.div>
        </div>

        {/* Charts */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.2 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              📈 Ausgaben-Verlauf
            </h3>
            {transactions.length > 0 ? (
              <ExpenseChart transactions={transactions} />
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-4xl mb-2">📭</p>
                <p>Noch keine Daten</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.25 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              📅 Wöchentlicher Trend
            </h3>
            {transactions.length > 0 ? (
              <WeeklyTrendChart transactions={transactions} />
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-4xl mb-2">📭</p>
                <p>Noch keine Daten</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.3 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              📊 Monatlicher Vergleich
            </h3>
            {transactions.length > 0 ? (
              <MonthlyComparisonChart transactions={transactions} />
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-4xl mb-2">📭</p>
                <p>Noch keine Daten</p>
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={animationVariants}
          transition={{ duration: animationDuration, delay: shouldAnimate ? 0.35 : 0 }}
        >
          <Card padding="md" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              🥧 Kategorien-Verteilung
            </h3>
            {categoryBreakdown.length > 0 ? (
              <>
                <CategoryPieChart data={categoryBreakdown} />

                <div className="mt-6 space-y-2">
                  {categoryBreakdown.map((cat, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg"
                      style={{ backgroundColor: 'var(--color-card-hover)' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cat.icon}</span>
                        <div>
                          <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {cat.name}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {Math.round((cat.total / totalExpenses) * 100)}% der Ausgaben
                          </p>
                        </div>
                      </div>
                      <p className="text-lg font-bold" style={{ color: cat.color }}>
                        {formatCurrency(cat.total)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-4xl mb-2">📊</p>
                <p>Noch keine Kategorien</p>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  )
}