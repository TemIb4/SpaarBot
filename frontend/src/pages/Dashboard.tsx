// src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, TrendingDown, TrendingUp, Eye, EyeOff,
  ArrowUpRight, Sparkles
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useTransactionStore } from '../store/transactionStore'
import { AddTransactionModal } from '../components/modals/AddTransactionModal'
import { TransactionList } from '../components/transactions/TransactionList'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'

const Dashboard: React.FC = () => {
  const { user, isPremium } = useUserStore()
  const { transactions, loading, fetchTransactions } = useTransactionStore()
  const [showBalance, setShowBalance] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

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

  const balance = totalIncome - totalExpenses

  const expenseChange = 12.5
  const incomeChange = 8.3

  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        <div className="mb-8">
          <motion.h1
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            className="text-3xl md:text-4xl font-bold text-white mb-2"
          >
            Willkommen zurück, {user?.first_name || 'User'}! 👋
          </motion.h1>
          <motion.p
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400"
          >
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
          </motion.p>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex p-1 rounded-2xl mb-8"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          {(['week', 'month', 'year'] as const).map((p) => (
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
              {p === 'week' ? 'Woche' : p === 'month' ? 'Monat' : 'Jahr'}
            </motion.button>
          ))}
        </motion.div>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-3xl p-8 mb-8 relative overflow-hidden"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          {isPremium && (
            <div
              className="absolute top-6 right-6 px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1"
              style={{
                background: premiumDesign.colors.gradients.premium,
                color: '#fff',
              }}
            >
              <Sparkles size={12} />
              <span>PREMIUM</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg text-neutral-400">Gesamtbilanz</h2>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              {showBalance ? (
                <Eye size={20} className="text-neutral-400" />
              ) : (
                <EyeOff size={20} className="text-neutral-400" />
              )}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {showBalance ? (
              <motion.div
                key="balance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-baseline space-x-3 mb-2">
                  <span className="text-5xl md:text-6xl font-bold text-white">
                    {balance.toFixed(2)}
                  </span>
                  <span className="text-3xl text-neutral-400">€</span>
                </div>
                <div className="flex items-center space-x-2">
                  {balance >= 0 ? (
                    <>
                      <TrendingUp size={16} className="text-success-500" />
                      <span className="text-sm text-success-500">
                        Positiver Saldo
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} className="text-danger-500" />
                      <span className="text-sm text-danger-500">
                        Negativer Saldo
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-5xl md:text-6xl font-bold text-neutral-700"
              >
                ••••••
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.accent[500]}20`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                }}
              >
                <TrendingDown size={24} className="text-accent-400" />
              </div>
              <div>
                <h3 className="text-sm text-neutral-400">Ausgaben</h3>
                <p className="text-xs text-neutral-500 capitalize">
                  {period === 'week' ? 'Diese Woche' : period === 'month' ? 'Dieser Monat' : 'Dieses Jahr'}
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-white mb-1">
                  {totalExpenses.toFixed(2)} €
                </div>
                <div className="flex items-center space-x-2">
                  {expenseChange > 0 ? (
                    <>
                      <ArrowUpRight size={14} className="text-danger-500" />
                      <span className="text-sm text-danger-500">
                        +{expenseChange}% vs. letzte Periode
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} className="text-success-500" />
                      <span className="text-sm text-success-500">
                        {expenseChange}% vs. letzte Periode
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.success[500]}20`,
                  border: `1px solid ${premiumDesign.colors.success[500]}40`,
                }}
              >
                <TrendingUp size={24} className="text-success-400" />
              </div>
              <div>
                <h3 className="text-sm text-neutral-400">Einkommen</h3>
                <p className="text-xs text-neutral-500 capitalize">
                  {period === 'week' ? 'Diese Woche' : period === 'month' ? 'Dieser Monat' : 'Dieses Jahr'}
                </p>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold text-white mb-1">
                  {totalIncome.toFixed(2)} €
                </div>
                <div className="flex items-center space-x-2">
                  {incomeChange > 0 ? (
                    <>
                      <ArrowUpRight size={14} className="text-success-500" />
                      <span className="text-sm text-success-500">
                        +{incomeChange}% vs. letzte Periode
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown size={14} className="text-danger-500" />
                      <span className="text-sm text-danger-500">
                        {incomeChange}% vs. letzte Periode
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="rounded-3xl p-6"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Letzte Transaktionen
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
              style={{
                background: premiumDesign.colors.gradients.primary,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              <Plus size={18} />
              <span>Hinzufügen</span>
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                📊
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Keine Transaktionen
              </h3>
              <p className="text-neutral-400 mb-6">
                Füge deine erste Transaktion hinzu
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{
                  background: premiumDesign.colors.gradients.primary,
                  boxShadow: premiumDesign.effects.shadow.glow,
                }}
              >
                Erste Transaktion hinzufügen
              </motion.button>
            </div>
          ) : (
            <TransactionList transactions={recentTransactions} />
          )}
        </motion.div>

        <AnimatePresence>
          {showAddModal && (
            <AddTransactionModal onClose={() => setShowAddModal(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default Dashboard