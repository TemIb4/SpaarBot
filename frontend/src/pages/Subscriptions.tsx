import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, Calendar, TrendingDown, AlertCircle, 
  Edit2, Trash2, DollarSign, Clock
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { api } from '../lib/api'
import { format, addDays, differenceInDays } from 'date-fns'
import { de } from 'date-fns/locale'

interface Subscription {
  id: number
  name: string
  icon: string
  amount: number
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date: string
  category: string
  auto_detected: boolean
  confirmed: boolean
}

const Subscriptions: React.FC = () => {
  const { } = useUserStore()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [unconfirmed, setUnconfirmed] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [showSetupWizard, setShowSetupWizard] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/subscriptions')
      const subs = response.data || []
      
      setSubscriptions(subs.filter((s: Subscription) => s.confirmed))
      setUnconfirmed(subs.filter((s: Subscription) => !s.confirmed))
      
      // Show wizard if there are unconfirmed subscriptions
      if (subs.filter((s: Subscription) => !s.confirmed).length > 0) {
        setShowSetupWizard(true)
      }
    } catch (error) {
      console.error('Error loading subscriptions:', error)
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
          auto_detected: true,
          confirmed: true,
        },
        {
          id: 2,
          name: 'Netflix',
          icon: '🎬',
          amount: 12.99,
          billing_cycle: 'monthly',
          next_billing_date: addDays(new Date(), 5).toISOString(),
          category: 'Entertainment',
          auto_detected: true,
          confirmed: true,
        },
      ])
      setUnconfirmed([
        {
          id: 3,
          name: 'Amazon Prime',
          icon: '📦',
          amount: 8.99,
          billing_cycle: 'monthly',
          next_billing_date: addDays(new Date(), 8).toISOString(),
          category: 'Shopping',
          auto_detected: true,
          confirmed: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const confirmSubscription = async (id: number) => {
    try {
      await api.post(`/api/v1/subscriptions/${id}/confirm`)
      const sub = unconfirmed.find(s => s.id === id)
      if (sub) {
        setSubscriptions([...subscriptions, { ...sub, confirmed: true }])
        setUnconfirmed(unconfirmed.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error confirming subscription:', error)
    }
  }

  const rejectSubscription = async (id: number) => {
    try {
      await api.delete(`/api/v1/subscriptions/${id}`)
      setUnconfirmed(unconfirmed.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error rejecting subscription:', error)
    }
  }

  const deleteSubscription = async (id: number) => {
    if (!confirm('Möchtest du dieses Abonnement wirklich löschen?')) return
    
    try {
      await api.delete(`/api/v1/subscriptions/${id}`)
      setSubscriptions(subscriptions.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting subscription:', error)
    }
  }

  const totalMonthly = subscriptions
    .reduce((sum, s) => sum + (s.billing_cycle === 'monthly' ? s.amount : s.amount / 12), 0)

  const totalYearly = subscriptions
    .reduce((sum, s) => sum + (s.billing_cycle === 'yearly' ? s.amount : s.amount * 12), 0)

  const getDaysUntilBilling = (date: string) => {
    return differenceInDays(new Date(date), new Date())
  }

  const getBillingStatus = (days: number) => {
    if (days === 0) return { text: 'Heute', color: premiumDesign.colors.danger[500] }
    if (days === 1) return { text: 'Morgen', color: premiumDesign.colors.warning[500] }
    if (days <= 7) return { text: `in ${days} Tagen`, color: premiumDesign.colors.warning[500] }
    return { text: `in ${days} Tagen`, color: premiumDesign.colors.neutral[500] }
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Abonnements</h1>
            <p className="text-neutral-400">
              Verwalte deine wiederkehrenden Zahlungen
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {/* TODO: Add new subscription */}}
            className="px-4 py-2 rounded-xl font-semibold text-white flex items-center space-x-2"
            style={{
              background: premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <Plus size={18} />
            <span>Hinzufügen</span>
          </motion.button>
        </div>

        {/* Setup Wizard for Unconfirmed Subscriptions */}
        <AnimatePresence>
          {showSetupWizard && unconfirmed.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="rounded-3xl p-6 mb-8"
              style={{
                background: premiumDesign.colors.neutral[900],
                border: `2px solid ${premiumDesign.colors.primary[500]}`,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{
                      background: premiumDesign.colors.gradients.primary,
                      boxShadow: premiumDesign.effects.shadow.glow,
                    }}
                  >
                    🔍
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Neue Abonnements erkannt!
                    </h2>
                    <p className="text-sm text-neutral-400">
                      Wir haben {unconfirmed.length} mögliche{' '}
                      {unconfirmed.length === 1 ? 'Abonnement' : 'Abonnements'} in deinen Transaktionen gefunden
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSetupWizard(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {unconfirmed.map((sub) => (
                  <motion.div
                    key={sub.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="rounded-2xl p-4 flex items-center justify-between"
                    style={{
                      background: premiumDesign.glass.light.background,
                      border: premiumDesign.glass.light.border,
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{sub.icon}</div>
                      <div>
                        <h3 className="font-bold text-white">{sub.name}</h3>
                        <p className="text-sm text-neutral-400">
                          {sub.amount.toFixed(2)} € • {sub.billing_cycle === 'monthly' ? 'Monatlich' : 'Jährlich'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => rejectSubscription(sub.id)}
                        className="px-4 py-2 rounded-xl font-semibold text-sm"
                        style={{
                          background: premiumDesign.glass.light.background,
                          border: premiumDesign.glass.light.border,
                          color: premiumDesign.colors.danger[400],
                        }}
                      >
                        Kein Abo
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => confirmSubscription(sub.id)}
                        className="px-4 py-2 rounded-xl font-semibold text-sm text-white"
                        style={{
                          background: premiumDesign.colors.success[500],
                        }}
                      >
                        ✓ Bestätigen
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Monthly Total */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.primary[500]}20`,
                  border: `1px solid ${premiumDesign.colors.primary[500]}40`,
                }}
              >
                <Calendar size={24} className="text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm text-neutral-400">Pro Monat</h3>
                <p className="text-xs text-neutral-500">
                  {subscriptions.length} {subscriptions.length === 1 ? 'Abo' : 'Abos'}
                </p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {totalMonthly.toFixed(2)} €
            </div>
          </motion.div>

          {/* Yearly Projection */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${premiumDesign.colors.accent[500]}20`,
                  border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                }}
              >
                <TrendingDown size={24} className="text-accent-400" />
              </div>
              <div>
                <h3 className="text-sm text-neutral-400">Pro Jahr</h3>
                <p className="text-xs text-neutral-500">Prognose</p>
              </div>
            </div>
            <div className="text-4xl font-bold text-white">
              {totalYearly.toFixed(2)} €
            </div>
          </motion.div>
        </div>

        {/* Subscriptions List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : subscriptions.length === 0 ? (
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
              📅
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Keine Abonnements
            </h3>
            <p className="text-neutral-400 mb-6">
              Füge dein erstes Abonnement hinzu oder verbinde dein Bankkonto für automatische Erkennung
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {/* TODO */}}
              className="px-6 py-3 rounded-xl font-semibold text-white"
              style={{
                background: premiumDesign.colors.gradients.primary,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              Erstes Abo hinzufügen
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {subscriptions
              .sort((a, b) => getDaysUntilBilling(a.next_billing_date) - getDaysUntilBilling(b.next_billing_date))
              .map((sub, index) => {
                const daysUntil = getDaysUntilBilling(sub.next_billing_date)
                const status = getBillingStatus(daysUntil)

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    className="rounded-2xl p-6"
                    style={{
                      background: premiumDesign.colors.neutral[900],
                      border: daysUntil <= 1
                        ? `2px solid ${premiumDesign.colors.warning[500]}`
                        : `1px solid ${premiumDesign.colors.neutral[800]}`,
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="text-4xl">{sub.icon}</div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-bold text-white text-lg">{sub.name}</h3>
                            {sub.auto_detected && (
                              <span 
                                className="px-2 py-0.5 text-xs font-bold rounded-full"
                                style={{
                                  background: `${premiumDesign.colors.primary[500]}20`,
                                  color: premiumDesign.colors.primary[400],
                                }}
                              >
                                Auto
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-neutral-400">
                            <span className="flex items-center space-x-1">
                              <DollarSign size={14} />
                              <span>{sub.amount.toFixed(2)} €</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Clock size={14} />
                              <span>{sub.billing_cycle === 'monthly' ? 'Monatlich' : 'Jährlich'}</span>
                            </span>
                            <span 
                              className="flex items-center space-x-1 font-semibold"
                              style={{ color: status.color }}
                            >
                              <AlertCircle size={14} />
                              <span>{status.text}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className="text-2xl font-bold text-white">
                            {sub.amount.toFixed(2)} €
                          </div>
                          <div className="text-xs text-neutral-500">
                            {format(new Date(sub.next_billing_date), 'dd. MMM', { locale: de })}
                          </div>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {/* TODO: Edit */}}
                          className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                        >
                          <Edit2 size={18} className="text-neutral-400" />
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => deleteSubscription(sub.id)}
                          className="p-2 rounded-xl hover:bg-danger-500/20 transition-colors"
                        >
                          <Trash2 size={18} className="text-danger-500" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
          </div>
        )}

        {/* Savings Tip */}
        {totalMonthly > 50 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 rounded-2xl p-6"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">💡</div>
              <div className="text-sm text-neutral-300">
                <p className="font-semibold text-white mb-2">Spar-Tipp</p>
                <p>
                  Du gibst <span className="font-bold text-white">{totalMonthly.toFixed(2)} €</span> pro Monat für Abonnements aus. 
                  Überprüfe regelmäßig, ob du alle Dienste noch aktiv nutzt, um Geld zu sparen!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default Subscriptions