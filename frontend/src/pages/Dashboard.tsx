import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, Plus, Calendar,
  PieChart, BarChart3, ArrowUpRight, ArrowDownRight
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useNavigate } from 'react-router-dom'
import { PremiumHeader } from '../components/layout/PremiumHeader'
import { TransactionList } from '../components/transactions/TransactionList'
import { AddTransactionModal } from '../components/modals/AddTransactionModal'
import { format } from 'date-fns'
import { de, enUS, ru, uk } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'

const Dashboard = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  // Locale mapping for date-fns
  const localeMap = {
    de: de,
    en: enUS,
    ru: ru,
    uk: uk,
  }
  const dateLocale = localeMap[language as keyof typeof localeMap] || de

  // Mock data
  const totalBalance = 2454.50
  const totalExpenses = 45.50
  const totalIncome = 2500.00
  const monthlySubscriptions = 22.98

  const recentTransactions = [
    {
      id: 1,
      type: 'expense' as const,
      amount: 45.50,
      description: 'Rewe Einkauf',
      category: 'food',
      date: new Date().toISOString(),
    },
    {
      id: 2,
      type: 'income' as const,
      amount: 2500.00,
      description: t('categories.salary'),
      category: 'salary',
      date: new Date().toISOString(),
    },
  ]

  const quickStats = [
    {
      label: t('dashboard.average_day'),
      value: '15.17 €',
      change: '+5.2%',
      positive: true,
      icon: TrendingUp,
    },
    {
      label: t('dashboard.biggest_expense'),
      value: '45.50 €',
      subtitle: 'Rewe Einkauf',
      icon: ArrowDownRight,
    },
    {
      label: t('dashboard.savings_quote'),
      value: '98.2%',
      change: '+2.1%',
      positive: true,
      icon: PieChart,
    },
  ]

  return (
    <div className="min-h-screen">
      <PremiumHeader />

      <div className="pt-20 px-4 pb-24 max-w-7xl mx-auto">
        {/* Welcome */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6"
        >
          <h2 className="text-2xl font-bold text-white mb-1">
            {t('dashboard.welcome')} 👋
          </h2>
          <p className="text-sm text-neutral-400">
            {format(new Date(), 'EEEE, dd. MMMM yyyy', { locale: dateLocale })}
          </p>
        </motion.div>

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
          {(['week', 'month', 'year'] as const).map((period) => (
            <motion.button
              key={period}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPeriod(period)}
              className="px-6 py-2 rounded-xl font-semibold transition-all"
              style={{
                background: selectedPeriod === period
                  ? premiumDesign.colors.gradients.primary
                  : 'transparent',
                color: selectedPeriod === period ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              {t(`dashboard.${period}`)}
            </motion.button>
          ))}
        </motion.div>

        {/* Balance Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-3 rounded-2xl p-5"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.lg,
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80 mb-2">{t('dashboard.total_balance')}</p>
                <p className="text-4xl font-bold text-white mb-1">
                  {totalBalance.toFixed(2)} €
                </p>
                <div className="flex items-center space-x-2">
                  <TrendingUp size={14} className="text-white/80" />
                  <p className="text-sm text-white/80">
                    +{((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
              <div className="text-5xl">💰</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">📉</div>
              <ArrowDownRight size={16} className="text-accent-400" />
            </div>
            <p className="text-xs text-neutral-500 mb-1">{t('dashboard.expenses')}</p>
            <p className="text-xl font-bold text-accent-400">
              {totalExpenses.toFixed(2)} €
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-xl p-4"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">📈</div>
              <ArrowUpRight size={16} className="text-success-400" />
            </div>
            <p className="text-xs text-neutral-500 mb-1">{t('dashboard.income')}</p>
            <p className="text-xl font-bold text-success-400">
              {totalIncome.toFixed(2)} €
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate('/subscriptions')}
            className="rounded-xl p-4 cursor-pointer"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-2xl">📅</div>
              <Calendar size={16} className="text-warning-400" />
            </div>
            <p className="text-xs text-neutral-500 mb-1">{t('dashboard.subscriptions_month')}</p>
            <p className="text-xl font-bold text-warning-400">
              {monthlySubscriptions.toFixed(2)} €
            </p>
          </motion.div>
        </div>

        {/* Quick Stats - Компактная оптимизированная версия */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {quickStats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              className="rounded-xl p-3"
              style={{
                background: premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <stat.icon size={16} className="text-primary-400 flex-shrink-0" />
                {stat.change && (
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: stat.positive
                        ? premiumDesign.colors.success[400]
                        : premiumDesign.colors.danger[400],
                    }}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mb-1 leading-tight">{stat.label}</p>
              <p className="text-base md:text-lg font-bold text-white mb-0.5 truncate">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-neutral-600 truncate">{stat.subtitle}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">{t('dashboard.recent_transactions')}</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/stats')}
              className="text-sm font-semibold text-primary-400"
            >
              {t('dashboard.show_all')} →
            </motion.button>
          </div>

          <TransactionList transactions={recentTransactions} />
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="grid grid-cols-2 gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddTransaction(true)}
            className="p-4 rounded-xl font-semibold text-white flex items-center justify-center space-x-2"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <Plus size={20} />
            <span>{t('dashboard.new_transaction')}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/stats')}
            className="p-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
              color: premiumDesign.colors.neutral[300],
            }}
          >
            <BarChart3 size={20} />
            <span>{t('dashboard.view_stats')}</span>
          </motion.button>
        </motion.div>
      </div>

      {showAddTransaction && (
        <AddTransactionModal onClose={() => setShowAddTransaction(false)} />
      )}
    </div>
  )
}

export default Dashboard