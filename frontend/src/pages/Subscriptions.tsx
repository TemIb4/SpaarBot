import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Calendar, TrendingDown,
  Edit2, Trash2, Clock
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useLanguage } from '../contexts/LanguageContext'
import { api } from '../lib/api'
import { format, addDays, differenceInDays } from 'date-fns'
import { de, enUS, ru, uk } from 'date-fns/locale'

interface Subscription {
  id: number
  name: string
  icon: string
  amount: number
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date: string
  category: string
}

const Subscriptions: React.FC = () => {
  const { t, language } = useLanguage()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  // 🔧 используем localeMap и language
  const localeMap = { de, en: enUS, ru, uk }
  const dateLocale = localeMap[language as keyof typeof localeMap] || de

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/subscriptions')
      setSubscriptions(response.data || [])
    } catch (error) {
      // Mock data
      setSubscriptions([
        {
          id: 1,
          name: 'Spotify',
          icon: '🎵',
          amount: 9.99,
          billing_cycle: 'monthly',
          next_billing_date: addDays(new Date(), 1).toISOString(),
          category: 'Entertainment',
        },
        {
          id: 2,
          name: 'Netflix',
          icon: '🎬',
          amount: 12.99,
          billing_cycle: 'monthly',
          next_billing_date: addDays(new Date(), 5).toISOString(),
          category: 'Entertainment',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    return sum + (sub.billing_cycle === 'monthly' ? sub.amount : sub.amount / 12)
  }, 0)

  const totalYearly = totalMonthly * 12

  const getDaysUntilBilling = (date: string) => {
    const days = differenceInDays(new Date(date), new Date())
    if (days === 0) return t('subscriptions.today')
    if (days === 1) return t('subscriptions.tomorrow')
    return t('subscriptions.in_x_days').replace('{days}', days.toString())
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-6 px-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {t('subscriptions.title')}
            </h1>
            <p className="text-sm text-neutral-400">
              {t('subscriptions.manage_payments')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">{t('subscriptions.add_subscription')}</span>
          </motion.button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl p-4"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <Calendar size={20} className="text-primary-400" />
              <span className="text-xs text-neutral-500">{t('subscriptions.monthly')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalMonthly.toFixed(2)} €</p>
            <p className="text-xs text-neutral-500 mt-1">
              {subscriptions.length} {t('subscriptions.n_subscriptions').replace('{n}', subscriptions.length.toString())}
            </p>
          </motion.div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingDown size={20} className="text-warning-400" />
              <span className="text-xs text-neutral-500">{t('subscriptions.yearly')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalYearly.toFixed(0)} €</p>
            <p className="text-xs text-neutral-500 mt-1">{t('subscriptions.forecast')}</p>
          </motion.div>
        </div>

        {/* List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
                style={{
                  background: premiumDesign.glass.medium.background,
                  border: premiumDesign.glass.medium.border,
                }}
              >
                📅
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {t('subscriptions.no_subscriptions')}
              </h3>
              <p className="text-neutral-400 text-sm mb-6">
                {t('subscriptions.add_first')}
              </p>
            </div>
          ) : (
            subscriptions.map((sub, index) => {
              const daysUntil = getDaysUntilBilling(sub.next_billing_date)
              const isUrgent = differenceInDays(new Date(sub.next_billing_date), new Date()) <= 3
              const formattedDate = format(new Date(sub.next_billing_date), 'PPP', { locale: dateLocale })

              return (
                <motion.div
                  key={sub.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.05 }}
                  className="rounded-xl p-3"
                  style={{
                    background: premiumDesign.colors.neutral[900],
                    border: isUrgent
                      ? `1px solid ${premiumDesign.colors.warning[500]}40`
                      : `1px solid ${premiumDesign.colors.neutral[800]}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{
                        background: premiumDesign.glass.light.background,
                        border: premiumDesign.glass.light.border,
                      }}
                    >
                      {sub.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-bold text-white truncate">{sub.name}</h3>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Clock size={12} />
                          <span className="truncate">
                            {daysUntil} • {formattedDate}
                          </span>
                        </span>
                        <span className="text-white font-bold flex-shrink-0">
                          {sub.amount.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: premiumDesign.glass.light.background,
                        }}
                      >
                        <Edit2 size={14} className="text-neutral-400" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: premiumDesign.glass.light.background,
                        }}
                      >
                        <Trash2 size={14} className="text-danger-400" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Subscriptions
