import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { premiumDesign } from '../../config/premiumDesign'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'

interface Transaction {
  id: number
  type: 'expense' | 'income'
  amount: number
  date: string
}

interface WeeklyTrendChartProps {
  transactions: Transaction[]
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ transactions }) => {
  // Get current week
  const now = new Date()
  const weekStart = startOfWeek(now, { locale: de })
  const weekEnd = endOfWeek(now, { locale: de })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Group by day of week
  const chartData = weekDays.map(day => {
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
      day: format(day, 'EEEEEE', { locale: de }), // Mo, Di, Mi, etc.
      fullDay: format(day, 'EEEE', { locale: de }),
      expenses: parseFloat(expenses.toFixed(2)),
      income: parseFloat(income.toFixed(2)),
      balance: parseFloat((income - expenses).toFixed(2)),
      isToday: format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'),
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
          <p className="text-white font-bold mb-2">{payload[0].payload.fullDay}</p>
          <div className="space-y-1">
            <p className="text-accent-400 text-sm">
              Ausgaben: {payload[0].value.toFixed(2)} €
            </p>
            <p className="text-success-400 text-sm">
              Einnahmen: {payload[0].payload.income.toFixed(2)} €
            </p>
          </div>
        </div>
      )
    }
    return null
  }


  if (chartData.every(d => d.expenses === 0 && d.income === 0)) {
    return (
      <div className="text-center py-16 text-neutral-400">
        Keine Transaktionen diese Woche
      </div>
    )
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={premiumDesign.colors.neutral[800]}
            vertical={false}
          />
          <XAxis
            dataKey="day"
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

          {/* Expenses Bars */}
          <Bar
            dataKey="expenses"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-expense-${index}`}
                fill={entry.isToday
                  ? premiumDesign.colors.accent[500]
                  : premiumDesign.colors.accent[600]
                }
                style={{
                  filter: entry.isToday
                    ? `drop-shadow(0px 0px 8px ${premiumDesign.colors.accent[500]})`
                    : 'none',
                }}
              />
            ))}
          </Bar>

          {/* Income Bars */}
          <Bar
            dataKey="income"
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-income-${index}`}
                fill={entry.isToday
                  ? premiumDesign.colors.success[500]
                  : premiumDesign.colors.success[600]
                }
                style={{
                  filter: entry.isToday
                    ? `drop-shadow(0px 0px 8px ${premiumDesign.colors.success[500]})`
                    : 'none',
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div
          className="p-4 rounded-xl text-center"
          style={{
            background: premiumDesign.glass.light.background,
            border: premiumDesign.glass.light.border,
          }}
        >
          <div className="text-sm text-neutral-400 mb-1">Gesamt Ausgaben</div>
          <div className="text-xl font-bold text-accent-400">
            {chartData.reduce((sum, d) => sum + d.expenses, 0).toFixed(2)} €
          </div>
        </div>

        <div
          className="p-4 rounded-xl text-center"
          style={{
            background: premiumDesign.glass.light.background,
            border: premiumDesign.glass.light.border,
          }}
        >
          <div className="text-sm text-neutral-400 mb-1">Gesamt Einnahmen</div>
          <div className="text-xl font-bold text-success-400">
            {chartData.reduce((sum, d) => sum + d.income, 0).toFixed(2)} €
          </div>
        </div>

        <div
          className="p-4 rounded-xl text-center"
          style={{
            background: premiumDesign.glass.light.background,
            border: premiumDesign.glass.light.border,
          }}
        >
          <div className="text-sm text-neutral-400 mb-1">Durchschnitt/Tag</div>
          <div className="text-xl font-bold text-primary-400">
            {(chartData.reduce((sum, d) => sum + d.expenses, 0) / 7).toFixed(2)} €
          </div>
        </div>
      </div>
    </div>
  )
}