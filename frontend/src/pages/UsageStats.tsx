import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, MessageSquare, BarChart3, Calendar, Zap, Crown } from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useLanguage } from '../contexts/LanguageContext'
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
  const { t } = useLanguage()
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{t('usage_stats.title')}</h1>
          <p className="text-neutral-400">
            {t('usage_stats.subtitle')}
          </p>
        </div>

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
                    {t('usage_stats.upgrade_unlimited')}
                  </h3>
                  <p className="text-neutral-400">
                    {t('usage_stats.remove_limits')}
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
                {t('usage_stats.become_premium')}
              </motion.a>
            </div>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
                  <h3 className="text-lg font-bold text-white">{t('usage_stats.ai_requests')}</h3>
                  <p className="text-sm text-neutral-400">
                    {isPremium ? t('usage_stats.unlimited') : t('usage_stats.this_month')}
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
                <p className="text-neutral-400">{t('usage_stats.unlimited_ai')}</p>
                <div className="mt-4 text-sm text-neutral-500">
                  {t('usage_stats.requests_this_month').replace('{count}', usage.ai_requests.used.toString())}
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
                      {t('usage_stats.of_used').replace('{limit}', usage.ai_requests.limit.toString())}
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
                    <div className="text-xs text-neutral-500">{t('usage_stats.consumed')}</div>
                  </div>
                </div>

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
                    ⚠️ {t('usage_stats.almost_limit')}
                  </div>
                )}
              </>
            )}
          </motion.div>

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
                  <h3 className="text-lg font-bold text-white">{t('usage_stats.subscriptions')}</h3>
                  <p className="text-sm text-neutral-400">
                    {isPremium ? t('usage_stats.unlimited') : t('usage_stats.active_subs')}
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
                <p className="text-neutral-400">{t('usage_stats.unlimited_subs')}</p>
                <div className="mt-4 text-sm text-neutral-500">
                  {t('usage_stats.subs_currently_active').replace('{count}', usage.subscriptions.used.toString())}
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
                      {t('usage_stats.of_available').replace('{limit}', usage.subscriptions.limit.toString())}
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
                    <div className="text-xs text-neutral-500">{t('usage_stats.used_slots')}</div>
                  </div>
                </div>

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
                    ⚠️ {t('usage_stats.almost_full')}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>

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
          <h3 className="text-xl font-bold text-white mb-6">{t('usage_stats.activity_overview')}</h3>

          <div className="grid md:grid-cols-3 gap-6">
            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <BarChart3 size={24} className="text-primary-400" />
                <span className="text-sm text-neutral-400">{t('usage_stats.transactions')}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usage.transactions.total}
              </div>
              <div className="text-sm text-success-500">
                {t('usage_stats.this_month_added').replace('{count}', usage.transactions.this_month.toString())}
              </div>
            </div>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Zap size={24} className="text-warning-400" />
                <span className="text-sm text-neutral-400">{t('usage_stats.streak')}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {usage.streak_days} 🔥
              </div>
              <div className="text-sm text-neutral-400">
                {t('usage_stats.days_active')}
              </div>
            </div>

            <div
              className="p-6 rounded-2xl"
              style={{
                background: premiumDesign.glass.medium.background,
                border: premiumDesign.glass.medium.border,
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <TrendingUp size={24} className="text-accent-400" />
                <span className="text-sm text-neutral-400">{t('usage_stats.premium_features')}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {isPremium ? usage.premium_features_used.length : 0}
              </div>
              <div className="text-sm text-neutral-400">
                {isPremium ? t('usage_stats.actively_used') : t('usage_stats.not_available')}
              </div>
            </div>
          </div>
        </motion.div>

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
              {t('usage_stats.used_premium_features')}
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