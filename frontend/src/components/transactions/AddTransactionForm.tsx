/**
 * Form for adding new transactions
 */
import { useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { transactionsApi } from '@/api'
import { useTransactionStore } from '@/store/transactionStore'
import { useTelegram } from '@/hooks/useTelegram'
import type { Category } from '@/types'
import { format } from 'date-fns'

interface AddTransactionFormProps {
  categories: Category[]
  accountId: number
  onSuccess?: () => void
  onCancel?: () => void
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  categories,
  accountId,
  onSuccess,
  onCancel,
}) => {
  const { user, webApp } = useTelegram()
  const { addTransaction } = useTransactionStore()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('Benutzer nicht gefunden')
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Bitte gültigen Betrag eingeben')
      return
    }

    setIsSubmitting(true)

    try {
      const transaction = await transactionsApi.create(
        {
          account_id: accountId,
          amount: parseFloat(amount),
          description: description.trim() || undefined,
          category_id: parseInt(categoryId),
          transaction_type: 'expense',
          transaction_date: format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"),
        },
        user.id
      )

      addTransaction(transaction)

      // Haptic feedback
      webApp?.HapticFeedback.notificationOccurred('success')

      // Reset form
      setAmount('')
      setDescription('')
      setCategoryId(categories[0]?.id.toString() || '')

      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Speichern')
      webApp?.HapticFeedback.notificationOccurred('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat.id.toString(),
    label: cat.name,
    icon: cat.icon,
  }))

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <Input
        label="Betrag (€)"
        type="number"
        step="0.01"
        min="0"
        placeholder="z.B. 15.50"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <Input
        label="Beschreibung (optional)"
        type="text"
        placeholder="z.B. Kaffee bei Starbucks"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        }
      />

      <Select
        label="Kategorie"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={categoryOptions}
      />

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
        >
          {error}
        </motion.div>
      )}

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            fullWidth
          >
            Abbrechen
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          fullWidth
        >
          Speichern
        </Button>
      </div>
    </motion.form>
  )
}