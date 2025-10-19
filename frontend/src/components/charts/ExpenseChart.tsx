/**
 * Line chart for expense trends
 */
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { format, parseISO } from 'date-fns'
import { de } from 'date-fns/locale'

interface ExpenseChartProps {
  transactions: Transaction[]
}

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ transactions }) => {
  // Group transactions by date
  const groupedData = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((acc, transaction) => {
      const date = format(parseISO(transaction.transaction_date), 'dd.MM', { locale: de })

      if (!acc[date]) {
        acc[date] = 0
      }
      acc[date] += transaction.amount

      return acc
    }, {} as Record<string, number>)

  const chartData = Object.entries(groupedData).map(([date, amount]) => ({
    date,
    amount,
  }))

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-telegram-hint">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto mb-3 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>Noch keine Ausgaben im ausgewählten Zeitraum</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          style={{ fontSize: '12px' }}
          tickFormatter={(value) => `€${value}`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [formatCurrency(value), 'Ausgaben']}
        />
        <Line
          type="monotone"
          dataKey="amount"
          stroke="#2481cc"
          strokeWidth={3}
          dot={{ fill: '#2481cc', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}