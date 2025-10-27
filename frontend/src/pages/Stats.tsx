// src/pages/Stats.tsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, PieChart, BarChart3,
  LineChart as LineChartIcon, Calendar, Download
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useTransactionStore } from '../store/transactionStore'
import { useLanguage } from '../contexts/LanguageContext'
import { CategoryPieChart } from '../components/charts/CategoryPieChart'
import { ExpenseChart } from '../components/charts/ExpenseChart'
import { MonthlyComparisonChart } from '../components/charts/MonthlyComparisonChart'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

const Stats: React.FC = () => {
  const { transactions, loading, fetchTransactions } = useTransactionStore()
  const { t } = useLanguage()
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

  // ✅ ИСПРАВЛЕНО: переменные транзакций переименованы с t → tx
  const totalExpenses = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalIncome = transactions
    .filter(tx => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const averageExpense = transactions.filter(tx => tx.type === 'expense').length > 0
    ? totalExpenses / transactions.filter(tx => tx.type === 'expense').length
    : 0

  const highestExpense = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((max, tx) => tx.amount > max ? tx.amount : max, 0)

  // ✅ ИСПРАВЛЕНО: tx.category вместо t.category, t() - функция перевода
  const expensesByCategory = transactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, tx) => {
      const category = tx.category || t('categories.other')
      acc[category] = (acc[category] || 0) + tx.amount
      return acc
    }, {} as Record<string, number>)

  const topCategory = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)[0]

  // ✅ ИСПРАВЛЕНО: tx вместо t в map, t() используется только для перевода
  const exportData = () => {
    const csvContent = [
      ['Date', 'Type', 'Category', 'Description', 'Amount'].join(','),
      ...transactions.map(tx => [
        format(new Date(tx.date), 'dd.MM.yyyy'),
        tx.type === 'expense' ? t('dashboard.expenses') : t('dashboard.income'),
        tx.category || t('categories.other'),
        tx.description,
        tx.amount.toFixed(2)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `spaarbot-export-${format(new Date(), 'yyyy-MM-dd')}.csv`
    link.click()
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-6 px-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{t('stats.title')}</h1>
            <p className="text-sm text-neutral-400">
              {t('stats.detailed_analysis')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportData}
            className="px-3 py-2 md:px-4 md:py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <Download size={18} />
            <span className="hidden sm:inline text-sm">{t('stats.download')}</span>
          </motion.button>
        </div>

        {/* Period Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex p-1 rounded-2xl mb-6"
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
              className="px-4 py-2 rounded-xl font-semibold transition-all text-sm"
              style={{
                background: period === p
                  ? premiumDesign.colors.gradients.primary
                  : 'transparent',
                color: period === p ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              {t(`stats.${p}`)}
            </motion.button>
          ))}
        </motion.div>

        {/* Stats Grid - Компактная оптимизированная версия */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Expenses */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-3"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${premiumDesign.colors.accent[500]}20`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                }}
              >
                <TrendingDown size={16} className="text-accent-400" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="text-lg md:text-xl font-bold text-white truncate">
                  {totalExpenses.toFixed(0)} €
                </div>
                <div className="text-xs text-neutral-400 leading-tight">{t('stats.total_expenses')}</div>
              </div>
            </div>
          </motion.div>

          {/* Total Income */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-3"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${premiumDesign.colors.success[500]}20`,
                  border: `1px solid ${premiumDesign.colors.success[500]}40`,
                }}
              >
                <TrendingUp size={16} className="text-success-400" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="text-lg md:text-xl font-bold text-white truncate">
                  {totalIncome.toFixed(0)} €
                </div>
                <div className="text-xs text-neutral-400 leading-tight">{t('stats.total_income')}</div>
              </div>
            </div>
          </motion.div>

          {/* Average Expense */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-3"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${premiumDesign.colors.primary[500]}20`,
                  border: `1px solid ${premiumDesign.colors.primary[500]}40`,
                }}
              >
                <BarChart3 size={16} className="text-primary-400" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="text-lg md:text-xl font-bold text-white truncate">
                  {averageExpense.toFixed(0)} €
                </div>
                <div className="text-xs text-neutral-400 leading-tight">{t('stats.avg_expense')}</div>
              </div>
            </div>
          </motion.div>

          {/* Highest Expense */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-3"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${premiumDesign.colors.warning[500]}20`,
                  border: `1px solid ${premiumDesign.colors.warning[500]}40`,
                }}
              >
                <TrendingUp size={16} className="text-warning-400" />
              </div>
              <div className="flex-1 text-right min-w-0">
                <div className="text-lg md:text-xl font-bold text-white truncate">
                  {highestExpense.toFixed(0)} €
                </div>
                <div className="text-xs text-neutral-400 leading-tight">{t('stats.highest_expense')}</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Chart Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 mb-4 overflow-x-auto pb-2"
        >
          {[
            { id: 'pie', label: t('stats.categories'), icon: PieChart },
            { id: 'line', label: t('stats.trend'), icon: LineChartIcon },
            { id: 'bar', label: t('stats.weekly'), icon: BarChart3 },
            { id: 'comparison', label: t('stats.comparison'), icon: Calendar },
          ].map((chart) => (
            <motion.button
              key={chart.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedChart(chart.id as any)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl font-semibold whitespace-nowrap text-sm"
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
              <chart.icon size={16} />
              <span>{chart.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Chart Display */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-3xl p-4 md:p-6 mb-6"
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
                {t('stats.no_data')}
              </h3>
              <p className="text-neutral-400 text-sm">
                {t('dashboard.add_first')}
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

        {/* Category Breakdown */}
        {topCategory && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="rounded-3xl p-4 md:p-6 mb-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <h2 className="text-lg md:text-xl font-bold text-white mb-4">
              {t('stats.expenses_by_category')}
            </h2>

            <div className="space-y-3">
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
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ background: color }}
                          />
                          <span className="text-white font-medium text-sm">{category}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold text-sm">
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
      </motion.div>
    </div>
  )
}

export default Stats