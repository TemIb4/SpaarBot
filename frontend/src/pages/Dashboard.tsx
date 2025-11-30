import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp, TrendingDown, Plus,
  ArrowUpRight, ArrowDownRight, Wallet,
  Zap, Target, ChevronRight, Bell
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store/userStore'
import { useTransactionStore } from '../store/transactionStore'
import { premiumDesign } from '../config/premiumDesign'
import { format } from 'date-fns'
import { de, enUS, ru, uk } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'

// --- MOCK DATA FOR CHARTS (В реальности брать из API) ---
const SPARKLINE_DATA = [40, 35, 55, 45, 60, 55, 75, 65, 85, 80, 95]

const Dashboard = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { user } = useUserStore()
  const { transactions, loading: txLoading, fetchTransactions } = useTransactionStore()

  const [balanceHidden, setBalanceHidden] = useState(false)

  // Получаем локаль
  const localeMap = useMemo(() => ({ de, en: enUS, ru, uk }), [language])
  const dateLocale = localeMap[language as keyof typeof localeMap] || enUS

  // Приветствие по времени суток
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return t('dashboard.good_morning') || 'Good morning'
    if (hour < 18) return t('dashboard.good_afternoon') || 'Good afternoon'
    return t('dashboard.good_evening') || 'Good evening'
  }, [t])

  useEffect(() => {
    fetchTransactions?.()
  }, [fetchTransactions])

  // --- COMPONENTS ---

  // 1. Hero Card с живым графиком
  const HeroCard = () => (
    <motion.div
      layoutId="hero-card"
      className="relative w-full h-56 rounded-3xl overflow-hidden shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      }}
    >
      {/* Abstract Background Blobs */}
      <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-primary-500/30 rounded-full blur-[80px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-accent-500/20 rounded-full blur-[60px]" />

      <div className="relative z-10 p-6 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/60 text-sm font-medium tracking-wide">
              {t('dashboard.total_balance') || 'Total Balance'}
            </p>
            <div
              className="flex items-center gap-3 mt-1 cursor-pointer"
              onClick={() => setBalanceHidden(!balanceHidden)}
            >
              <motion.h2
                key={balanceHidden ? 'hidden' : 'visible'}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold text-white tracking-tight"
              >
                {balanceHidden ? '••••••' : '€ 12,450.00'}
              </motion.h2>
              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                true ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                +2.4%
              </div>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10"
          >
            <Wallet size={20} className="text-white" />
          </motion.button>
        </div>

        {/* Custom SVG Sparkline */}
        <div className="h-16 w-full flex items-end gap-1">
          {SPARKLINE_DATA.map((val, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${val}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 bg-gradient-to-t from-primary-400/80 to-primary-300/20 rounded-t-sm"
              style={{ opacity: 0.5 + (i / SPARKLINE_DATA.length) * 0.5 }}
            />
          ))}
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <ArrowUpRight size={14} className="text-emerald-400" />
            </div>
            <span className="text-emerald-100 text-sm font-medium">€ 3,200</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center">
              <ArrowDownRight size={14} className="text-rose-400" />
            </div>
            <span className="text-rose-100 text-sm font-medium">€ 1,840</span>
          </div>
        </div>
      </div>
    </motion.div>
  )

  // 2. Quick Actions (Neumorphic Buttons)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ActionButton = ({ icon: Icon, label, color, onClick }: any) => (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 group"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:shadow-primary-500/30"
        style={{
          background: premiumDesign.glass.medium.background,
          border: `1px solid ${color}40`
        }}
      >
        <Icon size={24} style={{ color: color }} />
      </div>
      <span className="text-xs font-medium text-neutral-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </motion.button>
  )

  // 3. Modern Transaction Row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const TransactionRow = ({ tx, index }: any) => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center justify-between p-4 mb-2 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
          style={{
            background: tx.type === 'expense' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${tx.type === 'expense' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
          }}
        >
          {tx.icon || (tx.type === 'expense' ? '💸' : '💰')}
        </div>
        <div>
          <h4 className="text-white font-semibold">{tx.name || tx.category || 'Transaction'}</h4>
          <p className="text-xs text-neutral-500">
            {format(new Date(tx.date || Date.now()), 'dd MMM, HH:mm', { locale: dateLocale })}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-bold ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
          {tx.type === 'expense' ? '-' : '+'}€{Math.abs(tx.amount).toFixed(2)}
        </p>
        <p className="text-xs text-neutral-600">{tx.account || 'PayPal'}</p>
      </div>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white pb-24 font-sans selection:bg-primary-500/30">
      {/* Header Blur Effect */}
      <div className="fixed top-0 left-0 right-0 h-24 bg-gradient-to-b from-black via-black/80 to-transparent z-40 pointer-events-none" />

      <div className="relative z-0 max-w-md mx-auto px-5 pt-8">

        {/* Top Header */}
        <div className="flex items-center justify-between mb-8 mt-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <p className="text-neutral-400 text-sm font-medium mb-0.5">{greeting} 👋</p>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">
              {user?.first_name || 'Alexander'}
            </h1>
          </motion.div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center relative"
          >
            <Bell size={18} className="text-white" />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-black" />
          </motion.button>
        </div>

        {/* Main Hero Card */}
        <HeroCard />

        {/* Quick Actions Grid */}
        <div className="flex justify-between px-2 mt-8 mb-8">
          <ActionButton
            icon={Plus}
            label="Add"
            color="#6366f1"
            onClick={() => navigate('/add')}
          />
          <ActionButton
            icon={Target}
            label="Goals"
            color="#ec4899"
            onClick={() => navigate('/stats')}
          />
          <ActionButton
            icon={Zap}
            label="AI Tips"
            color="#eab308"
            onClick={() => navigate('/ai-chat')}
          />
          <ActionButton
            icon={Wallet}
            label="Cards"
            color="#14b8a6"
            onClick={() => navigate('/accounts')}
          />
        </div>

        {/* Bento Grid Info */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-3xl bg-neutral-900/50 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                <TrendingUp size={18} />
              </div>
              <span className="text-xs font-bold text-emerald-500">+12%</span>
            </div>
            <p className="text-neutral-400 text-xs mb-1">Total Income</p>
            <p className="text-xl font-bold text-white">€ 4,250</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-3xl bg-neutral-900/50 border border-white/5 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-2 bg-rose-500/20 rounded-xl text-rose-400">
                <TrendingDown size={18} />
              </div>
              <span className="text-xs font-bold text-rose-500">-5%</span>
            </div>
            <p className="text-neutral-400 text-xs mb-1">Monthly Spent</p>
            <p className="text-xl font-bold text-white">€ 1,840</p>
          </motion.div>
        </div>

        {/* Recent Transactions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Recent Activity</h3>
            <button
              onClick={() => navigate('/stats')}
              className="text-primary-400 text-sm font-medium flex items-center hover:opacity-80"
            >
              See All <ChevronRight size={16} />
            </button>
          </div>

          <div className="space-y-1">
            {txLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl bg-neutral-900/50 animate-pulse mb-2" />
              ))
            ) : transactions.length > 0 ? (
              transactions.slice(0, 5).map((tx, i) => (
                <TransactionRow key={tx.id || i} tx={tx} index={i} />
              ))
            ) : (
              // Fallback mock data for visual showcase if no real data
              [
                { id: 1, name: 'Netflix Subscription', amount: -12.99, type: 'expense', icon: '🎬', category: 'Entertainment' },
                { id: 2, name: 'Salary Deposit', amount: 3200.00, type: 'income', icon: '💼', category: 'Salary' },
                { id: 3, name: 'Uber Eats', amount: -24.50, type: 'expense', icon: '🍔', category: 'Food' },
              ].map((tx, i) => (
                <TransactionRow key={tx.id} tx={tx} index={i} />
              ))
            )}
          </div>
        </div>

        {/* AI Insight Pill - Floating at bottom */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="fixed bottom-24 left-5 right-5 z-30"
        >
          <div
            onClick={() => navigate('/ai-chat')}
            className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer hover:bg-white/15 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 animate-pulse">
              <Zap size={20} className="text-white fill-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-indigo-300 font-bold mb-0.5">AI INSIGHT</p>
              <p className="text-sm text-white leading-tight">You spent 15% less on food this week! Keep it up! 🎉</p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

export default Dashboard