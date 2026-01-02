// TransactionItem.tsx - ИСПРАВЛЕННЫЙ

import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Edit2, Trash2 } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import type { Transaction } from '../../types'

interface TransactionItemProps {
  transaction: Transaction
  onEdit?: (transaction: Transaction) => void
  onDelete?: (id: number) => void
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const isExpense = transaction.type === 'expense'

  // ИСПРАВЛЕНО: Безопасный парсинг дат
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
      })
    }

    try {
      const date = new Date(dateString)
      // Проверка что дата валидна
      if (isNaN(date.getTime())) {
        return new Date().toLocaleDateString('de-DE', {
          day: '2-digit',
          month: 'short',
        })
      }
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: 'short',
      }).format(date)
    } catch (error) {
      return new Date().toLocaleDateString('de-DE', {
        day: '2-digit',
        month: 'short',
      })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-2xl"
      style={{
        background: premiumDesign.glass.light.background,
        border: premiumDesign.glass.light.border,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{
              backgroundColor: isExpense
                ? `${premiumDesign.colors.accent[500]}20`
                : `${premiumDesign.colors.success[500]}20`,
              border: `1px solid ${
                isExpense
                  ? premiumDesign.colors.accent[500]
                  : premiumDesign.colors.success[500]
              }40`,
            }}
          >
            📦
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white truncate mb-1">
              {transaction.description || 'Transaction'}
            </h4>
            <div className="flex items-center space-x-3 text-xs text-neutral-500">
              <span>{transaction.category || 'Sonstiges'}</span>
              <span>•</span>
              <span>{formatDate(transaction.date)}</span>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div
              className="text-lg font-bold flex items-center space-x-1"
              style={{
                color: isExpense
                  ? premiumDesign.colors.accent[400]
                  : premiumDesign.colors.success[400],
              }}
            >
              {isExpense ? (
                <TrendingDown size={16} />
              ) : (
                <TrendingUp size={16} />
              )}
              <span>
                {isExpense ? '-' : '+'}
                {transaction.amount.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Actions */}
          {(onEdit || onDelete) && (
            <div className="flex items-center space-x-2">
              {onEdit && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onEdit(transaction)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Edit2 size={16} className="text-neutral-400" />
                </motion.button>
              )}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDelete(transaction.id)}
                  className="p-2 rounded-lg hover:bg-danger-500/20 transition-colors"
                >
                  <Trash2 size={16} className="text-danger-500" />
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}