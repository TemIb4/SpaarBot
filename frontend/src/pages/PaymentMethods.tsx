import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard, Plus, Trash2, Check, AlertCircle } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useLanguage } from '../contexts/LanguageContext'

interface PaymentMethod {
  id: number
  type: 'paypal' | 'card'
  last4?: string
  email?: string
  default: boolean
}

const PaymentMethods: React.FC = () => {
  const { t } = useLanguage()
  const [methods, setMethods] = useState<PaymentMethod[]>([
    {
      id: 1,
      type: 'paypal',
      email: 'user@example.com',
      default: true,
    }
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAddPayPal = async () => {
    setLoading(true)
    try {
      // TODO: Implement PayPal OAuth flow
      console.log('Adding PayPal account...')

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // For now, just show alert
      alert(t('payment.paypal_integration_message'))

    } catch (error) {
      console.error('Error adding PayPal:', error)
      alert(t('payment.error_adding'))
    } finally {
      setLoading(false)
      setShowAddModal(false)
    }
  }

  const removeMethod = async (id: number) => {
    if (!confirm(t('payment.confirm_remove'))) return

    setLoading(true)
    try {
      // TODO: API call to remove payment method
      setMethods(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      console.error('Error removing method:', error)
      alert(t('payment.error_removing'))
    } finally {
      setLoading(false)
    }
  }

  const setDefault = async (id: number) => {
    setLoading(true)
    try {
      // TODO: API call to set default payment method
      setMethods(prev => prev.map(m => ({ ...m, default: m.id === id })))
    } catch (error) {
      console.error('Error setting default:', error)
      alert(t('payment.error_setting_default'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('payment.title')}</h1>
            <p className="text-neutral-400">{t('payment.subtitle')}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <Plus size={18} />
            <span>{t('common.add')}</span>
          </motion.button>
        </div>

        {/* Info Banner */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-4 mb-6 flex items-start space-x-3"
          style={{
            background: `${premiumDesign.colors.primary[500]}20`,
            border: `1px solid ${premiumDesign.colors.primary[500]}40`,
          }}
        >
          <AlertCircle size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-neutral-300">
            <p className="font-semibold text-white mb-1">{t('payment.paypal_integration')}</p>
            <p>
              {t('payment.paypal_integration_desc')}
            </p>
          </div>
        </motion.div>

        {/* Payment Methods List */}
        <div className="space-y-4">
          {methods.length === 0 ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-16"
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                <CreditCard size={40} className="text-neutral-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('payment.no_methods')}
              </h3>
              <p className="text-neutral-400 mb-6">
                {t('payment.add_method_desc')}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white"
                style={{
                  background: premiumDesign.colors.gradients.primary,
                  boxShadow: premiumDesign.effects.shadow.glow,
                }}
              >
                {t('payment.add_first_method')}
              </motion.button>
            </motion.div>
          ) : (
            methods.map((method, index) => (
              <motion.div
                key={method.id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-2xl p-6"
                style={{
                  background: premiumDesign.colors.neutral[900],
                  border: method.default
                    ? `2px solid ${premiumDesign.colors.primary[500]}`
                    : `1px solid ${premiumDesign.colors.neutral[800]}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{
                        background: premiumDesign.glass.medium.background,
                        border: premiumDesign.glass.medium.border,
                      }}
                    >
                      {method.type === 'paypal' ? (
                        <span className="text-2xl">💳</span>
                      ) : (
                        <CreditCard size={24} className="text-primary-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-bold text-white">
                          {method.type === 'paypal' ? t('payment.paypal') : t('payment.credit_card')}
                        </h3>
                        {method.default && (
                          <span
                            className="px-2 py-0.5 text-xs font-bold rounded-full"
                            style={{
                              background: premiumDesign.colors.primary[500],
                              color: '#fff',
                            }}
                          >
                            {t('payment.default')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-400">
                        {method.type === 'paypal'
                          ? method.email
                          : `•••• •••• •••• ${method.last4}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!method.default && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setDefault(method.id)}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center space-x-1"
                        style={{
                          background: premiumDesign.glass.light.background,
                          border: premiumDesign.glass.light.border,
                          color: premiumDesign.colors.primary[400],
                        }}
                      >
                        <Check size={14} />
                        <span>{t('payment.set_as_default')}</span>
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeMethod(method.id)}
                      disabled={loading || method.default}
                      className="p-2 rounded-xl transition-colors hover:bg-danger-500/20"
                      title={t('common.delete')}
                    >
                      <Trash2 size={18} className="text-danger-500" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Add Payment Method Modal */}
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)' }}
            onClick={() => setShowAddModal(false)}
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
              <h2 className="text-2xl font-bold text-white mb-6">
                {t('payment.add_payment_method')}
              </h2>

              {/* PayPal Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddPayPal}
                disabled={loading}
                className="w-full p-6 rounded-2xl mb-4 text-left"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
                    style={{
                      background: '#0070ba20',
                      border: '1px solid #0070ba40',
                    }}
                  >
                    💳
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{t('payment.paypal')}</h3>
                    <p className="text-sm text-neutral-400">
                      {t('payment.paypal_secure')}
                    </p>
                  </div>
                  {loading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-500" />
                  ) : (
                    <Plus size={24} className="text-primary-400" />
                  )}
                </div>
              </motion.button>

              {/* Coming Soon - Credit Card */}
              <div
                className="w-full p-6 rounded-2xl opacity-50 cursor-not-allowed"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
              >
                <div className="flex items-center space-x-4">
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center"
                    style={{
                      background: premiumDesign.glass.light.background,
                    }}
                  >
                    <CreditCard size={32} className="text-neutral-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white mb-1">{t('payment.credit_card')}</h3>
                    <p className="text-sm text-neutral-400">
                      {t('payment.coming_soon')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(false)}
                className="w-full py-3 rounded-xl font-semibold text-neutral-400 mt-6"
                style={{
                  background: premiumDesign.glass.light.background,
                  border: premiumDesign.glass.light.border,
                }}
              >
                {t('common.cancel')}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default PaymentMethods