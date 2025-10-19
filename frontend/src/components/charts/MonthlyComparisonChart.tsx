/**
 * Monthly Comparison Bar Chart
 */
import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Transaction } from '@/types'

interface MonthlyComparisonChartProps {
  transactions: Transaction[]
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const monthlyData: { [key: string]: { expenses: number; income: number } } = {}

    transactions.forEach((t) => {
      const date = new Date(t.transaction_date)
      const monthKey = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { expenses: 0, income: 0 }
      }

      if (t.transaction_type === 'expense') {
        monthlyData[monthKey].expenses += t.amount
      } else {
        monthlyData[monthKey].income += t.amount
      }
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        Ausgaben: Math.round(data.expenses),
        Einnahmen: Math.round(data.income),
      }))
      .slice(-6) // Last 6 months
  }, [transactions])

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-card)',
            border: '2px solid var(--color-border)',
            borderRadius: '8px',
            color: 'var(--color-text)',
          }}
          formatter={(value: number) => `${value.toFixed(2)} €`}
        />
        <Legend
          wrapperStyle={{ color: 'var(--color-text)' }}
        />
        <Bar dataKey="Ausgaben" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
        <Bar dataKey="Einnahmen" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}