/**
 * Weekly Trend Line Chart
 */
import { useMemo } from 'react'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts' // ✅ Убрали LineChart и Line
import { Transaction } from '@/types'

interface WeeklyTrendChartProps {
  transactions: Transaction[]
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({ transactions }) => {
  const data = useMemo(() => {
    const last7Days: { [key: string]: number } = {}

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toLocaleDateString('de-DE', { weekday: 'short' })
      last7Days[dayKey] = 0
    }

    transactions
      .filter(t => t.transaction_type === 'expense')
      .forEach((t) => {
        const date = new Date(t.transaction_date)
        const daysDiff = Math.floor((new Date().getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff <= 6) {
          const dayKey = date.toLocaleDateString('de-DE', { weekday: 'short' })
          last7Days[dayKey] += t.amount
        }
      })

    return Object.entries(last7Days).map(([day, amount]) => ({
      day,
      Ausgaben: Math.round(amount * 100) / 100,
    }))
  }, [transactions])

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="day"
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
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
        <Area
          type="monotone"
          dataKey="Ausgaben"
          stroke="var(--color-primary)"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorExpenses)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}