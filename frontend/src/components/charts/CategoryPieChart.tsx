/**
 * Pie chart for category breakdown
 */
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import type { CategoryBreakdown } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface CategoryPieChartProps {
  data: CategoryBreakdown[]
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (data.length === 0) {
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
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
          <p>Keine Kategorie-Daten verfügbar</p>
        </div>
      </div>
    )
  }

  const chartData = data.map(cat => ({
    name: `${cat.icon} ${cat.name}`,
    value: cat.total,
    color: cat.color,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => formatCurrency(value)}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  )
}