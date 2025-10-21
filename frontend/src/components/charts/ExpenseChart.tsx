import React from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { premiumDesign } from '../../config/premiumDesign'
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns'
import { de } from 'date-fns/locale'

interface Transaction {
  id: number
  type: 'expense' | 'income'
  amount: number
  date: string
}

interface ExpenseChartProps {
  transactions: Transaction[]
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions }) => {
  // Get date range
  const dates = transactions.map(t => new Date(t.date))
  const minDate = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : startOfMonth(new Date())
  const maxDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : endOfMonth(new Date())

  // Generate all days in range
  const allDays = eachDayOfInterval({ start: minDate, end: maxDate })

  // Group transactions by day
  const dataByDay = allDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTransactions = transactions.filter(t =>
      format(new Date(t.date), 'yyyy-MM-dd') === dayStr
    )

    const expenses = dayTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const income = dayTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      date: format(day, 'dd. MMM', { locale: de }),
      fullDate: day,
      expenses: parseFloat(expenses.toFixed(2)),
      income: parseFloat(income.toFixed(2)),
      balance: parseFloat((income - expenses).toFixed(2)),
    }
  })

  // Calculate cumulative balance
  let cumulativeBalance = 0
  const chartData = dataByDay.map(day => {
    cumulativeBalance += day.balance
    return {
      ...day,
      cumulative: parseFloat(cumulativeBalance.toFixed(2)),
    }
  })

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="px-4 py-3 rounded-xl"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            boxShadow: premiumDesign.effects.shadow.xl,
          }}
        >
          <p className="text-white font-bold mb-2">{payload[0].payload.date}</p>
          <div className="space-y-1">
            <p className="text-accent-400 text-sm">
              Ausgaben: {payload[0].payload.expenses.toFixed(2)} €
            </p>
            <p className="text-success-400 text-sm">
              Einnahmen: {payload[0].payload.income.toFixed(2)} €
            </p>
            <p className="text-primary-400 text-sm font-semibold">
              Bilanz: {payload[0].payload.cumulative.toFixed(2)} €
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400">
        Keine Transaktionen vorhanden
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={premiumDesign.colors.accent[500]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={premiumDesign.colors.accent[500]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={premiumDesign.colors.success[500]} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={premiumDesign.colors.success[500]} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={premiumDesign.colors.primary[500]} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={premiumDesign.colors.primary[500]} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={premiumDesign.colors.neutral[800]}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke={premiumDesign.colors.neutral[500]}
            style={{ fontSize: '12px' }}
            tick={{ fill: premiumDesign.colors.neutral[400] }}
          />
          <YAxis
            stroke={premiumDesign.colors.neutral[500]}
            style={{ fontSize: '12px' }}
            tick={{ fill: premiumDesign.colors.neutral[400] }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* Expenses Area */}
          <Area
            type="monotone"
            dataKey="expenses"
            stroke={premiumDesign.colors.accent[500]}
            strokeWidth={2}
            fill="url(#colorExpense)"
            animationDuration={1000}
          />

          {/* Income Area */}
          <Area
            type="monotone"
            dataKey="income"
            stroke={premiumDesign.colors.success[500]}
            strokeWidth={2}
            fill="url(#colorIncome)"
            animationDuration={1000}
          />

          {/* Cumulative Balance Line */}
          <Area
            type="monotone"
            dataKey="cumulative"
            stroke={premiumDesign.colors.primary[500]}
            strokeWidth={3}
            fill="url(#colorBalance)"
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-6 flex justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: premiumDesign.colors.accent[500] }}
          />
          <span className="text-sm text-neutral-300">Ausgaben</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: premiumDesign.colors.success[500] }}
          />
          <span className="text-sm text-neutral-300">Einnahmen</span>
        </div>
        <div className="flex items-center space-x-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: premiumDesign.colors.primary[500] }}
          />
          <span className="text-sm text-neutral-300">Kumulative Bilanz</span>
        </div>
      </div>
    </div>
  )
}