// src/pages/Stats.tsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, PieChart, BarChart3,
  LineChart as LineChartIcon, Calendar, Download
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useTransactionStore } from '../store/transactionStore'
import { CategoryPieChart } from '../components/charts/CategoryPieChart'
import { ExpenseChart } from '../components/charts/ExpenseChart'
import { MonthlyComparisonChart } from '../components/charts/MonthlyComparisonChart'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

const Stats: React.FC = () => {
  const { transactions, loading, fetchTransactions } = useTransactionStore()
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [selectedChart, setSelectedChart] = useState<'pie' | 'line' | 'bar' | 'comparison'>('pie')

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date = now

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      case 'quarter':
        startDate = subMonths(now, 3)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = startOfMonth(now)
    }

    if (fetchTransactions) {
      await fetchTransactions(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'))
    }
  }

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const averageExpense = transactions.filter(t => t.type === 'expense').length > 0
    ? totalExpenses / transactions.filter(t => t.type === 'expense').length
    : 0

  const highestExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((max, t) => t.amount > max ? t.amount : max, 0)

// Около строки 70-75, ЗАМЕНИТЬ:
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Sonstiges'  // ✅ Теперь это строка
      acc[category] = (acc[category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const topCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0]

  const exportData = () => {
    const csvContent = [
      ['Datum', 'Typ', 'Kategorie', 'Beschreibung', 'Betrag'].join(','),
      ...transactions.map(t => [
        format(new Date(t.date), 'dd.MM.yyyy'),
        t.type === 'expense' ? 'Ausgabe' : 'Einnahme',
        t.category || 'Sonstiges',
        t.description,
        t.amount.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `spaarbot-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Statistiken</h1>
            <p className="text-neutral-400">
              Detaillierte Analyse deiner Finanzen
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportData}
              className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <Download size={18} />
              <span className="hidden sm:inline">Exportieren</span>
            </motion.button>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex p-1 rounded-2xl mb-8"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
            <motion.button
              key={p}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPeriod(p)}
              className="px-6 py-2 rounded-xl font-semibold transition-all capitalize"
              style={{
                background: period === p
                  ? premiumDesign.colors.gradients.primary
                  : 'transparent',
                color: period === p ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              {p === 'week' ? 'Woche' : p === 'month' ? 'Monat' : p === 'quarter' ? 'Quartal' : 'Jahr'}
            </motion.button>
          ))}
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: `${premiumDesign.colors.accent[500]}20`,
                border: `1px solid ${premiumDesign.colors.accent[500]}40`,
              }}
            >
              <TrendingDown size={20} className="text-accent-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {totalExpenses.toFixed(0)} €
            </div>
            <div className="text-xs text-neutral-400">Gesamt Ausgaben</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: `${premiumDesign.colors.success[500]}20`,
                border: `1px solid ${premiumDesign.colors.success[500]}40`,
              }}
            >
              <TrendingUp size={20} className="text-success-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {totalIncome.toFixed(0)} €
            </div>
            <div className="text-xs text-neutral-400">Gesamt Einnahmen</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: `${premiumDesign.colors.primary[500]}20`,
                border: `1px solid ${premiumDesign.colors.primary[500]}40`,
              }}
            >
              <BarChart3 size={20} className="text-primary-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {averageExpense.toFixed(0)} €
            </div>
            <div className="text-xs text-neutral-400">Ø Ausgabe</div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{
                background: `${premiumDesign.colors.warning[500]}20`,
                border: `1px solid ${premiumDesign.colors.warning[500]}40`,
              }}
            >
              <TrendingUp size={20} className="text-warning-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {highestExpense.toFixed(0)} €
            </div>
            <div className="text-xs text-neutral-400">Höchste Ausgabe</div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center space-x-3 mb-6 overflow-x-auto pb-2"
        >
          {[
            { id: 'pie', label: 'Kategorien', icon: PieChart },
            { id: 'line', label: 'Trend', icon: LineChartIcon },
            { id: 'bar', label: 'Wöchentlich', icon: BarChart3 },
            { id: 'comparison', label: 'Vergleich', icon: Calendar },
          ].map((chart) => (
            <motion.button
              key={chart.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedChart(chart.id as any)}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-semibold whitespace-nowrap"
              style={{
                background: selectedChart === chart.id
                  ? premiumDesign.colors.gradients.primary
                  : premiumDesign.glass.light.background,
                border: selectedChart === chart.id
                  ? 'none'
                  : premiumDesign.glass.light.border,
                color: selectedChart === chart.id ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              <chart.icon size={18} />
              <span>{chart.label}</span>
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl p-6 mb-8"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                📊
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Keine Daten verfügbar
              </h3>
              <p className="text-neutral-400">
                Füge Transaktionen hinzu, um Statistiken zu sehen
              </p>
            </div>
          ) : (
            <>
              {selectedChart === 'pie' && <CategoryPieChart transactions={transactions} />}
              {selectedChart === 'line' && <ExpenseChart transactions={transactions} />}
              {selectedChart === 'bar' && <WeeklyTrendChart transactions={transactions} />}
              {selectedChart === 'comparison' && <MonthlyComparisonChart transactions={transactions} />}
            </>
          )}
        </motion.div>

        {topCategory && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <h2 className="text-xl font-bold text-white mb-6">
              Ausgaben nach Kategorie
            </h2>

            <div className="space-y-4">
              {Object.entries(expensesByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, amount], index) => {
                  const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
                  const colors = [
                    premiumDesign.colors.primary[500],
                    premiumDesign.colors.accent[500],
                    premiumDesign.colors.success[500],
                    premiumDesign.colors.warning[500],
                    premiumDesign.colors.danger[500],
                  ]
                  const color = colors[index % colors.length]

                  return (
                    <motion.div
                      key={category}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.9 + index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="text-white font-medium">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">
                            {amount.toFixed(2)} €
                          </div>
                          <div className="text-xs text-neutral-400">
                            {percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ background: premiumDesign.colors.neutral[800] }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.9 + index * 0.05 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                    </motion.div>
                  )
                })}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 rounded-2xl p-6"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <div className="flex items-start space-x-3">
            <TrendingUp size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-neutral-300">
              <p className="font-semibold text-white mb-2">💡 Smart Insights</p>
              <ul className="space-y-1">
                {topCategory && (
                  <li>
                    • Deine größte Ausgabenkategorie ist <span className="text-white font-semibold">{topCategory[0]}</span> mit {topCategory[1].toFixed(2)} €
                  </li>
                )}
                {totalExpenses > totalIncome && (
                  <li className="text-warning-400">
                    • ⚠️ Du gibst mehr aus als du einnimmst. Überlege, Ausgaben zu reduzieren.
                  </li>
                )}
                {averageExpense > 50 && (
                  <li>
                    • Deine durchschnittliche Ausgabe beträgt {averageExpense.toFixed(2)} €
                  </li>
                )}
                <li>
                  • Du hast {transactions.filter(t => t.type === 'expense').length} Ausgaben in dieser Periode erfasst
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Stats