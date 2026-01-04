import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, Wallet,
  Zap, Target, ChevronRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactionStore } from '../store/transactionStore'
import { premiumDesign } from '../config/premiumDesign'
import { format } from 'date-fns'
import { de, enUS, ru, uk } from 'date-fns/locale'
import { useLanguage } from '../contexts/LanguageContext'
import { apiService } from '../lib/api'

const SPARKLINE_DATA = [40, 35, 55, 45, 60, 55, 75, 65, 85, 80, 95]

interface DashboardStats {
  total_balance: number
  total_income: number
  total_expenses: number
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { t, language } = useLanguage()
  const { transactions, loading: txLoading, fetchTransactions } = useTransactionStore()
  const [balanceHidden, setBalanceHidden] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  const localeMap = useMemo(() => ({ de, en: enUS, ru, uk }), [language])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dateLocale = (localeMap as any)[language] || enUS

  useEffect(() => {
    fetchTransactions?.()
    loadStats()
  }, [fetchTransactions])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const tg = (window as any).Telegram?.WebApp
      const userId = tg?.initDataUnsafe?.user?.id

      if (!userId) {
        console.error('No Telegram user ID')
        setStatsLoading(false)
        return
      }

      const response = await apiService.stats.dashboard(userId, 'month')
      setStats(response.data)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const displayTransactions = useMemo(() => {
    if (transactions && transactions.length > 0) return transactions.slice(0, 3)
    return []
  }, [transactions])

  // --- Components ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ActionButton = ({ icon: Icon, label, color, path }: any) => (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.92 }}
      onClick={(e) => { e.stopPropagation(); navigate(path); }}
      className="flex flex-col items-center gap-2.5 group cursor-pointer w-full"
    >
      <div
        className="w-[60px] h-[60px] rounded-[24px] flex items-center justify-center shadow-lg transition-all duration-300 relative overflow-hidden bg-[#1A1A1A] border border-white/5"
        style={{ boxShadow: premiumDesign.effects.shadow.md }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{ background: `radial-gradient(circle at center, ${color}, transparent 70%)` }}
        />
        <Icon size={26} style={{ color: color }} strokeWidth={2} className="relative z-10" />
      </div>
      <span className="text-xs font-semibold text-neutral-400 group-hover:text-white transition-colors">
        {label}
      </span>
    </motion.button>
  )

  const HeroCard = () => (
    <motion.div
      layoutId="hero-card"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full h-auto min-h-[220px] rounded-[32px] overflow-hidden shadow-2xl mb-8 border border-white/10"
      style={{ background: 'linear-gradient(135deg, #050505 0%, #1a1a2e 100%)' }}
    >
      <div className="absolute top-[-50%] left-[-20%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-56 h-56 bg-purple-600/20 rounded-full blur-[80px]" />

      <div className="relative z-10 p-6 flex flex-col justify-between h-full min-h-[220px]">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-white/60 text-sm font-medium tracking-wide uppercase opacity-80 mb-1">
              {t('dashboard.total_balance') || 'Gesamtguthaben'}
            </p>
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setBalanceHidden(!balanceHidden)}>
              <h2 className="text-4xl font-bold text-white tracking-tight font-mono-numbers">
                {statsLoading ? (
                  <span className="text-white/40">Loading...</span>
                ) : balanceHidden ? (
                  '••••••'
                ) : (
                  `€ ${(stats?.total_balance || 0).toFixed(2).replace('.', ',')}`
                )}
              </h2>
            </div>
          </div>
          <div onClick={() => navigate('/accounts')} className="p-3 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 text-white cursor-pointer active:scale-95 transition-transform">
            <Wallet size={22} />
          </div>
        </div>
        <div className="h-16 w-full flex items-end gap-1.5 opacity-50 my-4">
           {SPARKLINE_DATA.map((val, i) => (
             <div key={i} className="flex-1 bg-white rounded-t-sm" style={{ height: `${val}%` }} />
           ))}
        </div>
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
              <ArrowUpRight size={16} className="text-emerald-400" />
            </div>
            <div className="flex flex-col">
               <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{t('dashboard.income') || 'Income'}</span>
               <span className="text-emerald-100 text-sm font-bold">
                 {statsLoading ? '...' : `€ ${(stats?.total_income || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
               </span>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-3 bg-white/5 p-3 rounded-2xl backdrop-blur-sm border border-white/5">
            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
              <ArrowDownRight size={16} className="text-rose-400" />
            </div>
            <div className="flex flex-col">
               <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{t('dashboard.expenses') || 'Expenses'}</span>
               <span className="text-rose-100 text-sm font-bold">
                 {statsLoading ? '...' : `€ ${(stats?.total_expenses || 0).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
               </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="w-full">
      {/* ЛОКАЛЬНЫЙ ХЕДЕР УДАЛЕН. ОТСТУП ЗАДАЕТСЯ В LAYOUT.TSX */}

      <HeroCard />

      <div className="grid grid-cols-3 gap-4 mb-10 px-1">
        <ActionButton icon={Target} label={t('nav.stats') || 'Stats'} color="#f472b6" path="/stats" />
        <ActionButton icon={Zap} label="AI" color="#fbbf24" path="/ai-chat" />
        <ActionButton icon={Wallet} label={t('nav.wallet') || 'Wallet'} color="#2dd4bf" path="/accounts" />
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="text-lg font-bold text-white">{t('dashboard.activity') || 'Activity'}</h3>
          <button onClick={() => navigate('/stats')} className="text-indigo-400 text-sm font-semibold flex items-center hover:opacity-80">
            {t('common.view_all') || 'View All'} <ChevronRight size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {txLoading ? (
            [1, 2, 3].map(i => (
              <div key={i} className="h-[72px] rounded-3xl bg-neutral-900/50 animate-pulse border border-white/5" />
            ))
          ) : displayTransactions.length > 0 ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            displayTransactions.map((tx: any, i: number) => (
               <div key={tx.id || i} className="flex items-center justify-between p-4 rounded-3xl bg-[#151515] border border-white/5 active:bg-neutral-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${tx.type === 'expense' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                     {tx.type === 'expense' ? '💸' : '💰'}
                   </div>
                   <div>
                      <p className="text-white font-semibold text-sm mb-0.5">{tx.description}</p>
                      <p className="text-neutral-500 text-xs">
                        {tx.category} • {format(new Date(tx.date), 'dd MMM', { locale: dateLocale })}
                      </p>
                   </div>
                </div>
                <span className={`font-bold font-mono-numbers ${tx.type === 'expense' ? 'text-white' : 'text-emerald-400'}`}>
                  {tx.type === 'expense' ? '-' : '+'}€{Math.abs(tx.amount).toFixed(2)}
                </span>
             </div>
            ))
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-900 flex items-center justify-center">
                <Wallet size={32} className="text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-sm">
                {t('dashboard.no_transactions') || 'No transactions yet'}
              </p>
              <p className="text-neutral-600 text-xs mt-2">
                {t('dashboard.connect_account') || 'Connect your bank account to get started'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Insight - Scrollable */}
      {transactions && transactions.length > 3 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 mb-4"
        >
          <div
            onClick={() => navigate('/ai-chat')}
            className="bg-[#1A1A1A]/95 backdrop-blur-xl border border-indigo-500/30 p-4 rounded-2xl shadow-xl shadow-indigo-500/10 flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/40">
              <Zap size={20} className="text-white fill-white animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] text-indigo-300 font-bold tracking-wider mb-0.5 uppercase">
                {t('dashboard.ai_insight') || 'AI Insight'}
              </p>
              <p className="text-xs text-white font-medium leading-relaxed">
                {t('dashboard.ai_insight_message') || 'Ask AI about your spending patterns'}
              </p>
            </div>
            <ChevronRight size={18} className="text-neutral-500" />
          </div>
        </motion.div>
      )}

    </div>
  )
}

export default Dashboard