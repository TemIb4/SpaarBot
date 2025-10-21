import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { premiumDesign } from '../../config/premiumDesign'
import { format, startOfMonth, subMonths, eachMonthOfInterval } from 'date-fns'
import { de } from 'date-fns/locale'

interface Transaction {
  id: number
  type: 'expense' | 'income'
  amount: number
  date: string
}

interface MonthlyComparisonChartProps {
  transactions: Transaction[]
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ transactions }) => {
  // Get last 6 months
  const now = new Date()
  const months = eachMonthOfInterval({
    start: subMonths(startOfMonth(now), 5),
    end: now
  })

  // Group by month
  const chartData = months.map(month => {
    const monthStr = format(month, 'yyyy-MM')
    const monthTransactions = transactions.filter(t => 
      format(new Date(t.date), 'yyyy-MM') === monthStr
    )

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      month: format(month, 'MMM', { locale: de }),
      fullMonth: format(month, 'MMMM yyyy', { locale: de }),
      expenses: parseFloat(expenses.toFixed(2)),
      income: parseFloat(income.toFixed(2)),
      savings: parseFloat((income - expenses).toFixed(2)),
      isCurrentMonth: format(month, 'yyyy-MM') === format(now, 'yyyy-MM'),
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
          <p className="text-white font-bold mb-2">{payload[0].payload.fullMonth}</p>
          <div className="space-y-1">
            <p className="text-accent-400 text-sm">
              Ausgaben: {payload[0].payload.expenses.toFixed(2)} €
            </p>
            <p className="text-success-400 text-sm">
              Einnahmen: {payload[0].payload.income.toFixed(2)} €
            </p>
            <p 
              className="text-sm font-semibold"
              style={{
                color: payload[0].payload.savings >= 0 
                  ? premiumDesign.colors.success[400]
                  : premiumDesign.colors.danger[400]
              }}
            >
              Ersparnis: {payload[0].payload.savings.toFixed(2)} €
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
        Keine Daten für Monatsvergleich
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
            dataKey="month" 
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
          <Legend 
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '14px'
            }}
            iconType="circle"
          />
          
          <Bar 
            dataKey="expenses" 
            name="Ausgaben"
            fill={premiumDesign.colors.accent[500]}
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
          
          <Bar 
            dataKey="income" 
            name="Einnahmen"
            fill={premiumDesign.colors.success[500]}
            radius={[8, 8, 0, 0]}
            animationDuration={800}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Trend Analysis */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        <div 
          className="p-6 rounded-2xl"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <div className="text-sm text-neutral-400 mb-2">Durchschnitt pro Monat</div>
          <div className="flex items-baseline space-x-4">
            <div>
              <div className="text-xs text-accent-400 mb-1">Ausgaben</div>
              <div className="text-2xl font-bold text-white">
                {(chartData.reduce((sum, d) => sum + d.expenses, 0) / chartData.length).toFixed(0)} €
              </div>
            </div>
            <div>
              <div className="text-xs text-success-400 mb-1">Einnahmen</div>
              <div className="text-2xl font-bold text-white">
                {(chartData.reduce((sum, d) => sum + d.income, 0) / chartData.length).toFixed(0)} €
              </div>
            </div>
          </div>
        </div>

        <div
          className="p-6 rounded-2xl"
          style={{
            background: premiumDesign.glass.medium.background,
            border: premiumDesign.glass.medium.border,
          }}
        >
          <div className="text-sm text-neutral-400 mb-2">Gesamtersparnis (6 Monate)</div>
          <div
            className="text-3xl font-bold"
            style={{
              color: chartData.reduce((sum, d) => sum + d.savings, 0) >= 0
                ? premiumDesign.colors.success[400]
                : premiumDesign.colors.danger[400]
            }}
          >
            {chartData.reduce((sum, d) => sum + d.savings, 0).toFixed(2)} €
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            {chartData.filter(d => d.savings > 0).length} von {chartData.length} Monaten positiv
          </div>
        </div>
      </div>
    </div>
  )
}