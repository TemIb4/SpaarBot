// src/components/modals/AddTransactionModal.tsx

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, TrendingDown, TrendingUp, Calendar, Tag, FileText, DollarSign } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useTransactionStore } from '../../store/transactionStore'
import { format } from 'date-fns'

interface AddTransactionModalProps {
  onClose: () => void
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ onClose }) => {
  const { addTransaction } = useTransactionStore()
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  })

  const categories = {
    expense: [
      { id: 'food', name: 'Essen & Trinken', icon: '🍔' },
      { id: 'transport', name: 'Transport', icon: '🚗' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️' },
      { id: 'entertainment', name: 'Entertainment', icon: '🎬' },
      { id: 'health', name: 'Gesundheit', icon: '💊' },
      { id: 'other', name: 'Sonstiges', icon: '📦' },
    ],
    income: [
      { id: 'salary', name: 'Gehalt', icon: '💰' },
      { id: 'freelance', name: 'Freelance', icon: '💻' },
      { id: 'investment', name: 'Investment', icon: '📈' },
      { id: 'gift', name: 'Geschenk', icon: '🎁' },
      { id: 'other', name: 'Sonstiges', icon: '💵' },
    ],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.amount || !formData.description || !formData.category) {
      alert('Bitte fülle alle Felder aus')
      return
    }

      setLoading(true)
    try {
      await addTransaction({
        telegram_id: 123456789,  // ✅ ДОБАВИТЬ (потом получать из контекста)
        type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
      })
      onClose()
    } catch (error) {
      alert('Fehler beim Hinzufügen der Transaktion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: premiumDesign.colors.neutral[900],
          border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          boxShadow: premiumDesign.effects.shadow['2xl'],
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Neue Transaktion</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={24} className="text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className="inline-flex p-1 rounded-2xl w-full"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setType('expense')}
              className="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
              style={{
                background: type === 'expense'
                  ? premiumDesign.colors.gradients.expense
                  : 'transparent',
                color: type === 'expense' ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              <TrendingDown size={18} />
              <span>Ausgabe</span>
            </motion.button>
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setType('income')}
              className="flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center space-x-2"
              style={{
                background: type === 'income'
                  ? premiumDesign.colors.gradients.income
                  : 'transparent',
                color: type === 'income' ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              <TrendingUp size={18} />
              <span>Einnahme</span>
            </motion.button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center space-x-2">
              <DollarSign size={16} />
              <span>Betrag</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 pr-12 rounded-xl text-white text-lg font-semibold"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-lg font-semibold">
                €
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center space-x-2">
              <FileText size={16} />
              <span>Beschreibung</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="z.B. Kaffee bei Starbucks"
              className="w-full px-4 py-3 rounded-xl text-white"
              style={{
                background: premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-3 flex items-center space-x-2">
              <Tag size={16} />
              <span>Kategorie</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories[type].map((cat) => (
                <motion.button
                  key={cat.id}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFormData({ ...formData, category: cat.id })}
                  className="p-3 rounded-xl text-center transition-all"
                  style={{
                    background: formData.category === cat.id
                      ? premiumDesign.glass.medium.background
                      : premiumDesign.glass.light.background,
                    border: formData.category === cat.id
                      ? `2px solid ${premiumDesign.colors.primary[500]}`
                      : premiumDesign.glass.light.border,
                  }}
                >
                  <div className="text-2xl mb-1">{cat.icon}</div>
                  <div className="text-xs text-white font-medium">{cat.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-400 mb-2 flex items-center space-x-2">
              <Calendar size={16} />
              <span>Datum</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl text-white"
              style={{
                background: premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold text-white text-lg"
            style={{
              background: type === 'expense'
                ? premiumDesign.colors.gradients.expense
                : premiumDesign.colors.gradients.income,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                Wird hinzugefügt...
              </span>
            ) : (
              <>
                {type === 'expense' ? '💸' : '💰'} Transaktion hinzufügen
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  )
}