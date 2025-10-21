import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, MessageSquare, BarChart3, Calendar, Zap, Crown } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { api } from '../lib/api'

interface UsageData {
  ai_requests: {
    used: number
    limit: number
    percentage: number
  }
  subscriptions: {
    used: number
    limit: number
    percentage: number
  }
  transactions: {
    total: number
    this_month: number
  }
  premium_features_used: string[]
  streak_days: number
}

const UsageStats: React.FC = () => {
  const { isPremium } = useUserStore()
  const [usage, setUsage] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsageData()
  }, [])

  const loadUsageData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/v1/users/usage-stats')
      setUsage(response.data)
    } catch (error) {
      console.error('Error loading usage stats:', error)
      // Mock data
      setUsage({
        ai_requests: {
          used: isPremium ? 347 : 42,
          limit: isPremium ? -1 : 50,
          percentage: isPremium ? 0 : 84
        },
        subscriptions: {
          used: isPremium ? 12 : 3,
          limit: isPremium ? -1 : 4,
          percentage: isPremium ? 0 : 75
        },
        transactions: {
          total: 458,
          this_month: 87
        },
        premium_features_used: isPremium
          ? ['AI-Analyse', 'Erweiterte Statistiken', 'Unbegrenzte Abos']
          : [],
        streak_days: 23
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (!usage) return null

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nutzungsstatistiken</h1>
          <p className="text-neutral-400">
            Übersicht über deine Aktivitäten und genutzten Features
          </p>
        </div>

        {/* Premium Banner */}
        {!isPremium && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl p-6 mb-8 relative overflow-hidden"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `2px solid ${premiumDesign.colors.primary[500]}`,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                    boxShadow: premiumDesign.effects.shadow.glow,
                  }}
                >
                  👑
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Upgrade für unbegrenzte Nutzung
                  </h3>
                  <p className="text-neutral-400">
                    Entferne alle Limits und nutze SpaarBot ohne Einschränkungen
                  </p>
                </div>
              </div>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/upgrade"
                className="px-6 py-3 rounded-xl font-bold text-white"
                style={{
                  background: premiumDesign.colors.gradients.premium,
                  boxShadow: premiumDesign.effects.shadow.glow,
                }}
              >
                Premium werden
              </motion.a>
            </div>
          </motion.div>
        )}

        {/* Usage Cards Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI Requests */}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${premiumDesign.colors.primary[500]}20`,
                    border: `1px solid ${premiumDesign.colors.primary[500]}40`,
                  }}
                >
                  <MessageSquare size={24} className="text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI-Anfragen</h3>
                  <p className="text-sm text-neutral-400">
                    {isPremium ? 'Unbegrenzt' : 'Diesen Monat'}
                  </p>
                </div>
              </div>
              {isPremium && (
                <Crown size={24} className="text-yellow-400" />
              )}
            </div>

            {isPremium ? (
              <div className="text-center py-8">
                <div className="text-5xl font-bold text-white mb-2">∞</div>
                <p className="text-neutral-400">Unbegrenzte AI-Anfragen</p>
                <div className="mt-4 text-sm text-neutral-500">
                  {usage.ai_requests.used} Anfragen diesen Monat
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">
                      {usage.ai_requests.used}
                    </div>
                    <div className="text-sm text-neutral-400">
                      von {usage.ai_requests.limit} genutzt
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{
                        color: usage.ai_requests.percentage > 80
                          ? premiumDesign.colors.danger[500]
                          : premiumDesign.colors.primary[500]
                      }}
                    >
                      {usage.ai_requests.percentage}%
                    </div>
                    <div className="text-xs text-neutral-500">verbraucht</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ background: premiumDesign.colors.neutral[800] }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usage.ai_requests.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      background: usage.ai_requests.percentage > 80
                        ? premiumDesign.colors.gradients.danger
                        : premiumDesign.colors.gradients.primary
                    }}
                  />
                </div>

                {usage.ai_requests.percentage > 80 && (
                  <div
                    className="mt-4 p-3 rounded-xl text-sm"
                    style={{
                      background: `${premiumDesign.colors.warning[500]}20`,
                      border: `1px solid ${premiumDesign.colors.warning[500]}40`,
                      color: premiumDesign.colors.warning[400],
                    }}
                  >
                    ⚠️ Du hast fast dein monatliches Limit erreicht
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Subscriptions */}
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${premiumDesign.colors.accent[500]}20`,
                    border: `1px solid ${premiumDesign.colors.accent[500]}40`,
                  }}
                >
                  <Calendar size={24} className="text-accent-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Abonnements</h3>
                  <p className="text-sm text-neutral-400">
                    {isPremium ? 'Unbegrenzt' : 'Aktive Abos'}
                  </p>
                </div>
              </div>
              {isPremium && (
                <Crown size={24} className="text-yellow-400" />
              )}
            </div>

            {isPremium ? (
              <div className="text-center py-8">
                <div className="text-5xl font-bold text-white mb-2">∞</div>
                <p className="text-neutral-400">Unbegrenzte Abonnements</p>
                <div className="mt-4 text-sm text-neutral-500">
                  {usage.subscriptions.used} Abos aktuell aktiv
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold text-white mb-1">
                      {usage.subscriptions.used}
                    </div>
                    <div className="text-sm text-neutral-400">
                      von {usage.subscriptions.limit} verfügbar
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{
                        color: usage.subscriptions.percentage > 80
                          ? premiumDesign.colors.danger[500]
                          : premiumDesign.colors.accent[500]
                      }}
                    >
                      {usage.subscriptions.percentage}%
                    </div>
                    <div className="text-xs text-neutral-500">belegt</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ background: premiumDesign.colors.neutral[800] }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usage.subscriptions.percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{
                      background: usage.subscriptions.percentage > 80
                        ? premiumDesign.colors.gradients.danger
                        : premiumDesign.colors.gradients.expense
                    }}
                  />
                </div>

                {usage.subscriptions.percentage > 80 && (
                  <div
                    className="mt-4 p-3 rounded-xl text-sm"
                    style={{
                      background: `${premiumDesign.colors.warning[500]}20`,
                      border: `1px solid ${premiumDesign.colors.warning[500]}40`,
                      color: premiumDesign.colors.warning[400],
                    }}
                  >
                    ⚠️ Fast alle Abo-Slots belegt
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>

        {/* Activity Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl p-6 mb-8"
          style={{
            background: premiumDesign.colors.neutral[900],
            border: `1px solid ${premiumDesign.colors.neutral[800]}`,
          }}
        >
          <h3 className="text-xl font-bold text-white mb-6">Aktivitätsübersicht</h3>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Total Transactions */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <BarChart3 size={24} className="text-primary-400" />
                <span className="text-sm text-neutral-400">Transaktionen</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usage.transactions.total}
              </div>
              <div className="text-sm text-success-500">
                +{usage.transactions.this_month} diesen Monat
              </div>
            </div>

            {/* Streak */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Zap size={24} className="text-warning-400" />
                <span className="text-sm text-neutral-400">Streak</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usage.streak_days} 🔥
              </div>
              <div className="text-sm text-neutral-400">
                Tage in Folge aktiv
              </div>
            </div>

            {/* Premium Features */}
            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp size={24} className="text-accent-400" />
                <span className="text-sm text-neutral-400">Premium Features</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isPremium ? usage.premium_features_used.length : 0}
              </div>
              <div className="text-sm text-neutral-400">
                {isPremium ? 'aktiv genutzt' : 'nicht verfügbar'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Premium Features Used */}
        {isPremium && usage.premium_features_used.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-3xl p-6"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Genutzte Premium-Features
            </h3>
            <div className="flex flex-wrap gap-3">
              {usage.premium_features_used.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="px-4 py-2 rounded-xl font-medium flex items-center space-x-2"
                  style={{
                    background: premiumDesign.glass.medium.background,
                    border: premiumDesign.glass.medium.border,
                  }}
                >
                  <Crown size={16} className="text-yellow-400" />
                  <span className="text-white">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default UsageStats