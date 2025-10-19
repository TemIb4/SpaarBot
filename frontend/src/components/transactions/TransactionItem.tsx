/**
 * Individual transaction list item
 */
import { motion } from 'framer-motion'
import type { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

interface TransactionItemProps {
  transaction: Transaction
  onClick?: () => void
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
}) => {
  const isExpense = transaction.transaction_type === 'expense'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Category icon */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{
            backgroundColor: transaction.category?.color
              ? `${transaction.category.color}20`
              : '#f3f4f6',
          }}
        >
          {transaction.category?.icon || '📦'}
        </div>

        {/* Transaction details */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-telegram-text truncate">
            {transaction.description || 'Keine Beschreibung'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-telegram-hint">
              {transaction.category?.name || 'Sonstiges'}
            </span>
            <span className="text-telegram-hint">•</span>
            <span className="text-sm text-telegram-hint">
              {formatDate(transaction.transaction_date)}
            </span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className={`text-lg font-semibold ${isExpense ? 'text-red-500' : 'text-green-500'}`}>
        {isExpense ? '-' : '+'}
        {formatCurrency(transaction.amount)}
      </div>
    </motion.div>
  )
}