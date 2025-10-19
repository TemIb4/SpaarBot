/**
 * Add Transaction Modal Component
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '@/hooks/useTelegram'
import { useTransactions } from '@/hooks/useTransactions'
import { Button } from '@/components/ui/Button'
// import { Card } from '@/components/ui/Card'  ❌ УДАЛИЛИ - не используется
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useTelegram()
  const { categories } = useTransactions()
  const queryClient = useQueryClient()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.id || !amount || !categoryId) {
      alert('Bitte fülle alle Felder aus')
      return
    }

    setIsSubmitting(true)

    try {
      await api.post('/transactions/', {
        telegram_id: user.id,
        amount: parseFloat(amount),
        description,
        category_id: categoryId,
        transaction_type: type,
        transaction_date: new Date().toISOString().split('T')[0],
      })

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['category-breakdown'] })

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('✅ Transaktion gespeichert!')
      }

      onClose()

      setAmount('')
      setDescription('')
      setCategoryId(null)
      setType('expense')
    } catch (error) {
      console.error('Failed to add transaction:', error)
      alert('Fehler beim Speichern der Transaktion')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">💰 Neue Transaktion</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Typ</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        type === 'expense'
                          ? 'bg-red-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      📊 Ausgabe
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`p-3 rounded-lg font-medium transition-all ${
                        type === 'income'
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      💰 Einnahme
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="z.B. 15.50"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="z.B. Kaffee bei Starbucks"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Kategorie
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories
                      .filter(cat => cat.transaction_type.toLowerCase() === type)
                      .map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setCategoryId(category.id)}
                          className={`p-3 rounded-lg font-medium transition-all ${
                            categoryId === category.id
                              ? 'ring-2 ring-blue-500 bg-blue-50 scale-105'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-2xl">{category.icon}</span>
                          <span className="block text-xs mt-1">{category.name}</span>
                        </button>
                      ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isSubmitting}
                    disabled={!amount || !categoryId}
                  >
                    ✓ Speichern
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}