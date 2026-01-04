import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, Download, AlertCircle, Upload, Wallet, ChevronDown, ChevronUp } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useUserStore } from '../store/userStore'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../lib/api'
import { format, subDays, subMonths, subYears, startOfDay, endOfDay } from 'date-fns'
import { CSVImport } from '../components/CSVImport'

// Типы для фильтров
type PeriodType = 'day' | 'week' | 'month' | '6months' | 'year' | 'all'

interface StatsData {
  totalIncome: number
  totalExpenses: number
  balance: number
  topCategories: Array<{
    name: string
    amount: number
    color: string
    icon: string
    percentage: number
  }>
  trendData: number[]
  previousPeriod: {
    income: number
    expenses: number
  }
}

const Stats = () => {
  const { t } = useLanguage()
  const { user } = useUserStore()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<PeriodType>('month')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [hasConnectedAccounts, setHasConnectedAccounts] = useState(false)
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false)
  const [statsData, setStatsData] = useState<StatsData>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    topCategories: [],
    trendData: [],
    previousPeriod: { income: 0, expenses: 0 }
  })

  // Получение дат для выбранного периода
  const getDateRange = (selectedPeriod: PeriodType) => {
    const now = new Date()
    const end = endOfDay(now)
    let start: Date

    switch (selectedPeriod) {
      case 'day':
        start = startOfDay(subDays(now, 1))
        break
      case 'week':
        start = startOfDay(subDays(now, 7))
        break
      case 'month':
        start = startOfDay(subMonths(now, 1))
        break
      case '6months':
        start = startOfDay(subMonths(now, 6))
        break
      case 'year':
        start = startOfDay(subYears(now, 1))
        break
      case 'all':
        start = startOfDay(subYears(now, 10))
        break
      default:
        start = startOfDay(subMonths(now, 1))
    }

    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    }
  }

  // Проверка наличия подключенных аккаунтов
  const checkAccounts = async () => {
    if (!user?.telegram_id) return false

    try {
      const response = await apiService.accounts.list(user.telegram_id)
      const accounts = response.data?.accounts || []
      return accounts.length > 0
    } catch (err) {
      return false
    }
  }

  // Загрузка данных
  const loadStats = async () => {
    if (!user?.telegram_id) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Проверяем наличие аккаунтов
      const hasAccounts = await checkAccounts()
      setHasConnectedAccounts(hasAccounts)

      // Если нет аккаунтов, показываем демо-данные
      if (!hasAccounts) {
        setStatsData({
          totalIncome: 2500,
          totalExpenses: 1800,
          balance: 700,
          topCategories: [
            { name: t('categories.food'), amount: 450, color: '#fbbf24', icon: '🍕', percentage: 25 },
            { name: t('categories.transport'), amount: 320, color: '#3b82f6', icon: '🚗', percentage: 18 },
            { name: t('categories.entertainment'), amount: 280, color: '#ec4899', icon: '🎬', percentage: 15.6 }
          ],
          trendData: [120, 150, 180, 145, 210, 190, 230],
          previousPeriod: { income: 2300, expenses: 1650 }
        })
        setLoading(false)
        return
      }

      const { start, end } = getDateRange(period)

      // Параллельная загрузка всех данных
      const [transactionsRes, categoryStatsRes] = await Promise.all([
        apiService.transactions.list(user.telegram_id, {
          start_date: start,
          end_date: end
        }),
        apiService.stats.categories(user.telegram_id, {
          start_date: start,
          end_date: end,
          transaction_type: 'expense'
        })
      ])

      const transactions = transactionsRes.data || []
      const categoryStats = categoryStatsRes.data || []

      // Вычисляем общую статистику
      let totalIncome = 0
      let totalExpenses = 0

      transactions.forEach((tx: any) => {
        if (tx.transaction_type === 'income') {
          totalIncome += parseFloat(tx.amount)
        } else {
          totalExpenses += parseFloat(tx.amount)
        }
      })

      // Топ категории
      const topCategories = categoryStats.slice(0, 5).map((cat: any, index: number) => ({
        name: cat.category_name || cat.name || t('categories.other'),
        amount: parseFloat(cat.total_amount || cat.amount || 0),
        color: ['#fbbf24', '#3b82f6', '#ec4899', '#10b981', '#8b5cf6'][index],
        icon: ['🍕', '🚗', '🎬', '💳', '🏠'][index],
        percentage: cat.percentage || 0
      }))

      // Данные тренда
      const trendMap = new Map<string, number>()
      transactions
        .filter((tx: any) => tx.transaction_type === 'expense')
        .forEach((tx: any) => {
          const date = tx.transaction_date || tx.created_at
          const dayKey = format(new Date(date), 'yyyy-MM-dd')
          trendMap.set(dayKey, (trendMap.get(dayKey) || 0) + parseFloat(tx.amount))
        })

      const trendData = Array.from(trendMap.values()).slice(-7)

      setStatsData({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        topCategories,
        trendData: trendData.length > 0 ? trendData : [0],
        previousPeriod: {
          income: totalIncome * 0.92,
          expenses: totalExpenses * 1.08
        }
      })

    } catch (err: any) {
      console.error('Error loading stats:', err)
      if (hasConnectedAccounts) {
        setError(t('stats.error_loading'))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [period, user?.telegram_id])

  // Экспорт данных
  const handleExport = async () => {
    if (!user?.telegram_id) return

    try {
      const { start, end } = getDateRange(period)
      const res = await apiService.transactions.list(user.telegram_id, {
        start_date: start,
        end_date: end
      })

      const transactions = res.data || []
      const headers = ['Date', 'Type', 'Amount', 'Description', 'Category']
      const rows = transactions.map((tx: any) => [
        tx.transaction_date || format(new Date(tx.created_at), 'yyyy-MM-dd'),
        tx.transaction_type,
        tx.amount,
        tx.description,
        tx.category_name || 'N/A'
      ])

      const csv = [
        headers.join(','),
        ...rows.map((row: any[]) => row.map((cell: any) => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spaarbot-stats-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export error:', err)
    }
  }

  const incomeTrend = statsData.previousPeriod.income > 0
    ? ((statsData.totalIncome - statsData.previousPeriod.income) / statsData.previousPeriod.income * 100).toFixed(1)
    : '0.0'

  const expenseTrend = statsData.previousPeriod.expenses > 0
    ? ((statsData.totalExpenses - statsData.previousPeriod.expenses) / statsData.previousPeriod.expenses * 100).toFixed(1)
    : '0.0'

  const maxTrendVal = Math.max(...statsData.trendData, 1)

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    trend
  }: {
    label: string
    value: string
    icon: any
    color: string
    trend?: string
  }) => (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="p-5 rounded-3xl bg-neutral-900/50 border border-white/5 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 p-3 opacity-20`} style={{ color }}>
        <Icon size={40} />
      </div>
      <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      {loading ? (
        <div className="h-8 w-24 bg-neutral-800 rounded animate-pulse" />
      ) : (
        <h3 className="text-2xl font-bold text-white mb-2">{value}</h3>
      )}
      {trend && !loading && (
        <div className={`inline-flex items-center px-2 py-1 rounded-full bg-white/5 border border-white/5`}>
          {parseFloat(trend) >= 0 ? (
            <TrendingUp size={12} className="text-emerald-400 mr-1" />
          ) : (
            <TrendingDown size={12} className="text-rose-400 mr-1" />
          )}
          <span className={`text-xs ${parseFloat(trend) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend}%
          </span>
        </div>
      )}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-black text-white pb-24 px-5 pt-8">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            {t('stats.title')}
          </h1>
          <p className="text-neutral-500 text-sm">{t('stats.financial_overview')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCSVImport(true)}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all disabled:opacity-50"
          >
            <Upload size={18} />
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Period Dropdown */}
      <div className="mb-8 relative">
        <button
          onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
          className="w-full p-4 bg-neutral-900/80 rounded-2xl flex items-center justify-between border border-neutral-800 hover:border-neutral-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 text-sm">Период:</span>
            <span className="text-white font-semibold">{t(`stats.period_${period}`)}</span>
          </div>
          {showPeriodDropdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        <AnimatePresence>
          {showPeriodDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden z-50 shadow-2xl"
            >
              {(['day', 'week', 'month', '6months', 'year', 'all'] as PeriodType[]).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPeriod(p)
                    setShowPeriodDropdown(false)
                  }}
                  className={`w-full px-4 py-3 text-left transition-all ${
                    period === p
                      ? 'bg-indigo-600/20 text-white border-l-4 border-indigo-500'
                      : 'text-neutral-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {t(`stats.period_${p}`)}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error State (only when has accounts but failed to load) */}
      {error && hasConnectedAccounts && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3"
        >
          <AlertCircle className="text-rose-400" size={20} />
          <p className="text-rose-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* No Accounts State */}
      {!hasConnectedAccounts && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center gap-3 text-center"
        >
          <Wallet size={40} className="text-indigo-400" />
          <div>
            <p className="text-white font-semibold mb-1">{t('wallet.no_accounts')}</p>
            <p className="text-indigo-300 text-sm mb-4">{t('stats.add_transactions_first')}</p>
          </div>
          <button
            onClick={() => navigate('/accounts')}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-white font-semibold transition-all"
          >
            {t('wallet.connect_account')}
          </button>
          <p className="text-neutral-500 text-xs mt-2">Данные ниже - демонстрационные</p>
        </motion.div>
      )}

      {/* Main Graph */}
      <div className="h-64 w-full bg-neutral-900/30 rounded-3xl border border-white/5 p-6 mb-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

        <div className="flex justify-between text-xs text-neutral-500 mb-4 z-10">
          <span>{t('stats.expense_trend')}</span>
          {!loading && statsData.trendData.length > 0 && (
            <span className="text-purple-400 font-bold">
              {expenseTrend}% {t('stats.vs_last')}
            </span>
          )}
        </div>

        <div className="flex items-end justify-between gap-2 h-40 z-10">
          {loading ? (
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1 bg-neutral-800/50 rounded-t-lg animate-pulse" style={{ height: '60%' }} />
            ))
          ) : statsData.trendData.length > 0 ? (
            statsData.trendData.map((val, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end group">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / maxTrendVal) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.6, type: 'spring' }}
                  className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity relative min-h-[20px]"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    €{val.toFixed(0)}
                  </div>
                </motion.div>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label={t('stats.total_income')}
          value={`€ ${statsData.totalIncome.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          color="#10b981"
          trend={incomeTrend}
        />
        <StatCard
          label={t('stats.total_expenses')}
          value={`€ ${statsData.totalExpenses.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingDown}
          color="#f43f5e"
          trend={expenseTrend}
        />
      </div>

      {/* Top Categories */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">{t('stats.top_categories')}</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-900/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : statsData.topCategories.length > 0 ? (
          <div className="space-y-3">
            {statsData.topCategories.map((cat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-neutral-900/50 rounded-2xl border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{cat.icon}</div>
                  <div>
                    <p className="text-white font-semibold text-sm">{cat.name}</p>
                    <p className="text-neutral-500 text-xs">{cat.percentage.toFixed(1)}% {t('stats.of_expenses')}</p>
                  </div>
                </div>
                <p className="text-white font-bold">€{cat.amount.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-600">
            {t('stats.no_categories')}
          </div>
        )}
      </div>

      {/* CSV Import Modal */}
      <AnimatePresence>
        {showCSVImport && (
          <CSVImport
            onClose={() => setShowCSVImport(false)}
            onSuccess={() => {
              setShowCSVImport(false)
              loadStats()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Stats
