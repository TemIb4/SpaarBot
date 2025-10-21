import React from 'react'
import { motion } from 'framer-motion'
import { TrendingDown, TrendingUp, Calendar, Tag } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Transaction {
  id: number
  type: 'expense' | 'income'
  amount: number
  description: string
  category?: string | { id: number; name: string; icon: string; color: string }
  date: string
}

interface TransactionListProps {
  transactions: Transaction[]
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions }) => {
  const getCategoryIcon = (category?: string | { icon: string }) => {
    if (!category) return '📦'
    if (typeof category === 'string') {
      const icons: Record<string, string> = {
        food: '🍔',
        transport: '🚗',
        shopping: '🛍️',
        entertainment: '🎬',
        health: '💊',
        salary: '💰',
        freelance: '💻',
        investment: '📈',
        gift: '🎁',
        other: '📦',
      }
      return icons[category] || '📦'
    }
    return category.icon || '📦'
  }

  const getCategoryName = (category?: string | { name: string }) => {
    if (!category) return 'Sonstiges'
    if (typeof category === 'string') return category
    return category.name
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          className="rounded-2xl p-4"
          style={{
            background: premiumDesign.glass.light.background,
            border: premiumDesign.glass.light.border,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Category Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: transaction.type === 'expense'
                    ? `${premiumDesign.colors.accent[500]}20`
                    : `${premiumDesign.colors.success[500]}20`,
                  border: transaction.type === 'expense'
                    ? `1px solid ${premiumDesign.colors.accent[500]}40`
                    : `1px solid ${premiumDesign.colors.success[500]}40`,
                }}
              >
                {getCategoryIcon(transaction.category)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white truncate mb-1">
                  {transaction.description}
                </h4>
                <div className="flex items-center space-x-3 text-xs text-neutral-500">
                  <span className="flex items-center space-x-1">
                    <Tag size={12} />
                    <span className="capitalize">{getCategoryName(transaction.category)}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>
                      {format(new Date(transaction.date), 'dd. MMM', { locale: de })}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right ml-4">
              <div
                className="text-lg font-bold flex items-center space-x-1"
                style={{
                  color: transaction.type === 'expense'
                    ? premiumDesign.colors.accent[400]
                    : premiumDesign.colors.success[400]
                }}
              >
                {transaction.type === 'expense' ? (
                  <TrendingDown size={16} />
                ) : (
                  <TrendingUp size={16} />
                )}
                <span>
                  {transaction.type === 'expense' ? '-' : '+'}
                  {transaction.amount.toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}