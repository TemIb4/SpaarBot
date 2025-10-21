import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { premiumDesign } from '../../config/premiumDesign'
import { motion } from 'framer-motion'

interface Transaction {
  id: number
  type: 'expense' | 'income'
  amount: number
  category?: string
}

interface CategoryPieChartProps {
  transactions: Transaction[]
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ transactions }) => {
  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category || 'Sonstiges'
      acc[category] = (acc[category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  // Convert to chart data
  const chartData = Object.entries(expensesByCategory)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: parseFloat(value.toFixed(2)),
      percentage: 0,
    }))
    .sort((a, b) => b.value - a.value)

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0)
  chartData.forEach(item => {
    item.percentage = parseFloat(((item.value / total) * 100).toFixed(1))
  })

  // Premium color palette
  const COLORS = [
    premiumDesign.colors.primary[500],
    premiumDesign.colors.accent[500],
    premiumDesign.colors.success[500],
    premiumDesign.colors.warning[500],
    premiumDesign.colors.danger[500],
    premiumDesign.colors.primary[400],
    premiumDesign.colors.accent[400],
  ]

  // Custom label
  const renderCustomLabel = (entry: any) => {
    return `${entry.percentage}%`
  }

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
          <p className="text-white font-bold mb-1">{payload[0].name}</p>
          <p className="text-primary-400 font-semibold">
            {payload[0].value.toFixed(2)} € ({payload[0].payload.percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  if (chartData.length === 0) {
    return (
      <div className="text-center py-16 text-neutral-400">
        Keine Ausgaben vorhanden
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={140}
            innerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                style={{
                  filter: 'drop-shadow(0px 0px 8px rgba(99, 102, 241, 0.3))',
                }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {chartData.map((entry, index) => (
          <motion.div
            key={entry.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3 p-3 rounded-xl"
            style={{
              background: premiumDesign.glass.light.background,
              border: premiumDesign.glass.light.border,
            }}
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ background: COLORS[index % COLORS.length] }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {entry.name}
              </div>
              <div className="text-xs text-neutral-500">
                {entry.value.toFixed(2)} € • {entry.percentage}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Total Summary */}
      <div
        className="mt-6 p-6 rounded-2xl text-center"
        style={{
          background: premiumDesign.glass.medium.background,
          border: premiumDesign.glass.medium.border,
        }}
      >
        <div className="text-sm text-neutral-400 mb-2">Gesamt Ausgaben</div>
        <div className="text-4xl font-bold text-white">
          {total.toFixed(2)} €
        </div>
        <div className="text-sm text-neutral-500 mt-2">
          {chartData.length} {chartData.length === 1 ? 'Kategorie' : 'Kategorien'}
        </div>
      </div>
    </div>
  )
}