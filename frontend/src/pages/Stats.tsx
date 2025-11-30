import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Download } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

// Типы для фильтров
type PeriodType = 'week' | 'month' | '3months' | 'year'

const Stats = () => {
  const { t } = useLanguage()
  const [period, setPeriod] = useState<PeriodType>('month')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Имитация загрузки при смене периода
    setLoading(true)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [period])

  // Mock данных для чартов
  const chartData = [65, 45, 78, 32, 89, 56, 92]
  const maxVal = Math.max(...chartData)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ label, value, icon: Icon, color, trend }: any) => (
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
      {trend && (
        <div className="inline-flex items-center px-2 py-1 rounded-full bg-white/5 border border-white/5">
          <TrendingUp size={12} className="text-emerald-400 mr-1" />
          <span className="text-xs text-emerald-400">{trend}</span>
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
            Analytics
          </h1>
          <p className="text-neutral-500 text-sm">Financial overview</p>
        </div>
        <button
          onClick={() => alert('Exporting data...')}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
        >
          <Download size={18} />
        </button>
      </div>

      {/* Period Selector */}
      <div className="flex bg-neutral-900/80 p-1.5 rounded-2xl mb-8 overflow-x-auto no-scrollbar">
        {['week', 'month', '3months', 'year'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p as PeriodType)}
            className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              period === p
                ? 'bg-neutral-800 text-white shadow-lg'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {t(`stats.period_${p}`) || p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Graph Visualization */}
      <div className="h-64 w-full bg-neutral-900/30 rounded-3xl border border-white/5 p-6 mb-6 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

        <div className="flex justify-between text-xs text-neutral-500 mb-4 z-10">
          <span>Expense Trend</span>
          <span className="text-purple-400 font-bold">+12% vs last {period}</span>
        </div>

        <div className="flex items-end justify-between gap-2 h-40 z-10">
          {chartData.map((val, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end group">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: loading ? 0 : `${(val / maxVal) * 100}%` }}
                transition={{ delay: i * 0.1, duration: 0.6, type: 'spring' }}
                className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-pink-500 opacity-60 group-hover:opacity-100 transition-opacity relative"
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}€
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          label={t('stats.total_income') || 'Total Income'}
          value="€ 4,250"
          icon={TrendingUp}
          color="#10b981"
          trend="+8.2%"
        />
        <StatCard
          label={t('stats.total_expenses') || 'Total Expenses'}
          value="€ 2,140"
          icon={TrendingDown}
          color="#f43f5e"
          trend="-2.4%"
        />
      </div>

      {/* Top Categories */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Top Categories</h3>
        <div className="space-y-3">
          {[
            { name: 'Groceries', amount: 450, color: 'bg-yellow-500', icon: '🛒' },
            { name: 'Entertainment', amount: 230, color: 'bg-purple-500', icon: '🎬' },
            { name: 'Transport', amount: 120, color: 'bg-blue-500', icon: '🚕' },
          ].map((cat, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/30 border border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${cat.color} bg-opacity-20 flex items-center justify-center text-xl`}>
                  {cat.icon}
                </div>
                <div>
                  <p className="font-semibold text-white">{cat.name}</p>
                  <div className="w-24 h-1.5 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: loading ? 0 : '70%' }}
                      className={`h-full ${cat.color}`}
                    />
                  </div>
                </div>
              </div>
              <span className="font-bold text-white">€{cat.amount}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Stats