/**
 * List of transactions with animations
 */
import { motion, AnimatePresence } from 'framer-motion'
import type { Transaction } from '@/types'
import { TransactionItem } from './TransactionItem'

interface TransactionListProps {
  transactions: Transaction[]
  onTransactionClick?: (transaction: Transaction) => void
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onTransactionClick,
}) => {
  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <svg
            className="w-8 h-8 text-telegram-hint"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-telegram-text mb-1">
          Keine Transaktionen
        </h3>
        <p className="text-telegram-hint">
          Füge deine erste Ausgabe hinzu um zu starten
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-2"
    >
      <AnimatePresence mode="popLayout">
        {transactions.map((transaction) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onClick={() => onTransactionClick?.(transaction)}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  )
}