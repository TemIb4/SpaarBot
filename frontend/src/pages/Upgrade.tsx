import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, Sparkles, Zap, TrendingUp, BarChart3,
  Calendar, MessageSquare, Shield, Crown, X
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useLanguage } from '../contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

const Upgrade: React.FC = () => {
  const { isPremium } = useUserStore()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  const plans = {
    monthly: {
      price: 3.99,
      period: t('upgrade.per_month'),
      savings: null,
      priceId: 'price_monthly_premium'
    },
    yearly: {
      price: 39.99,
      period: t('upgrade.per_year'),
      savings: '17%',
      priceId: 'price_yearly_premium'
    }
  }

  const features = {
    free: [
      { icon: BarChart3, text: t('upgrade.feature_basic_stats'), included: true },
      { icon: Calendar, text: t('upgrade.feature_up_to_4_subs'), included: true },
      { icon: MessageSquare, text: t('upgrade.feature_50_ai'), included: true },
      { icon: TrendingUp, text: t('upgrade.feature_advanced_analytics'), included: false },
      { icon: Shield, text: t('upgrade.feature_priority_support'), included: false },
      { icon: Sparkles, text: t('upgrade.feature_unlimited_ai'), included: false },
    ],
    premium: [
      { icon: BarChart3, text: t('upgrade.feature_advanced_ai'), included: true },
      { icon: Calendar, text: t('upgrade.feature_unlimited_subs'), included: true },
      { icon: MessageSquare, text: t('upgrade.feature_unlimited_ai_requests'), included: true },
      { icon: TrendingUp, text: t('upgrade.feature_forecasts'), included: true },
      { icon: Shield, text: t('upgrade.feature_priority_247'), included: true },
      { icon: Sparkles, text: t('upgrade.feature_early_access'), included: true },
      { icon: Crown, text: t('upgrade.feature_exclusive_data'), included: true },
      { icon: Zap, text: t('upgrade.feature_auto_categorization'), included: true },
    ]
  }

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const plan = plans[selectedPlan]
      console.log('Upgrading to:', plan)
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert(`Redirecting to PayPal for ${plan.price}€/${plan.period}`)
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Ошибка при обновлении. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  if (isPremium) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div
            className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl"
            style={{
              background: premiumDesign.colors.gradients.premium,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            👑
          </div>
          <h1 className="text-3xl font-bold mb-4" style={{
            background: premiumDesign.colors.gradients.premium,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('upgrade.already_premium')}
          </h1>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            {t('upgrade.thank_you')}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/settings')}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            {t('upgrade.to_settings')}
          </motion.button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] py-8">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-6xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
            style={{
              background: premiumDesign.colors.gradients.premium,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <Crown size={40} className="text-white" />
          </motion.div>

          <h1
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{
              background: premiumDesign.colors.gradients.premium,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('upgrade.title')}
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            {t('upgrade.subtitle')}
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div
            className="inline-flex p-1 rounded-2xl"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPlan('monthly')}
              className="px-8 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: selectedPlan === 'monthly'
                  ? premiumDesign.colors.gradients.primary
                  : 'transparent',
                color: selectedPlan === 'monthly' ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              {t('upgrade.monthly')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedPlan('yearly')}
              className="px-8 py-3 rounded-xl font-semibold transition-all relative"
              style={{
                background: selectedPlan === 'yearly'
                  ? premiumDesign.colors.gradients.primary
                  : 'transparent',
                color: selectedPlan === 'yearly' ? '#fff' : premiumDesign.colors.neutral[400],
              }}
            >
              {t('upgrade.yearly')}
              {plans.yearly.savings && (
                <span
                  className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                    color: '#fff',
                  }}
                >
                  {t('upgrade.save_percent').replace('{percent}', plans.yearly.savings)}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl p-8"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
            }}
          >
            <div className="mb-6">
              <h3 className="text-2xl font-bold mb-2 text-white">{t('upgrade.free_plan')}</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">0</span>
                <span className="text-2xl text-neutral-400 ml-2">€</span>
              </div>
              <p className="text-neutral-400">{t('upgrade.for_starters')}</p>
            </div>

            <ul className="space-y-4 mb-8">
              {features.free.map((feature, index) => (
                <li key={index} className="flex items-start space-x-3">
                  {feature.included ? (
                    <Check size={20} className="text-success-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <X size={20} className="text-neutral-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${feature.included ? 'text-neutral-300' : 'text-neutral-600'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full py-3 rounded-xl font-semibold text-neutral-500"
              style={{
                background: premiumDesign.glass.light.background,
                border: premiumDesign.glass.light.border,
              }}
            >
              {t('upgrade.current_plan')}
            </button>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-3xl p-8 relative overflow-hidden"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `2px solid ${premiumDesign.colors.primary[500]}`,
              boxShadow: premiumDesign.effects.shadow.glow,
            }}
          >
            <div
              className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: premiumDesign.colors.gradients.premium,
                color: '#fff',
              }}
            >
              ⭐ {t('upgrade.popular')}
            </div>

            <div className="mb-6">
              <h3
                className="text-2xl font-bold mb-2"
                style={{
                  background: premiumDesign.colors.gradients.premium,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('upgrade.premium_plan')}
              </h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">
                  {plans[selectedPlan].price}
                </span>
                <span className="text-2xl text-neutral-400 ml-2">
                  €/{plans[selectedPlan].period}
                </span>
              </div>
              {selectedPlan === 'yearly' && (
                <p className="text-success-500 text-sm font-semibold">
                  {t('upgrade.save_compared').replace('{percent}', plans.yearly.savings!)}
                </p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              {features.premium.map((feature, index) => (
                <motion.li
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  key={index}
                  className="flex items-start space-x-3"
                >
                  <Check size={20} className="text-success-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-neutral-300">{feature.text}</span>
                </motion.li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-lg relative overflow-hidden"
              style={{
                background: premiumDesign.colors.gradients.premium,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                  {t('upgrade.loading')}
                </span>
              ) : (
                <>
                  <Sparkles size={20} className="inline mr-2" />
                  {t('upgrade.upgrade_now')}
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <div
            className="inline-flex items-center space-x-6 px-8 py-4 rounded-2xl"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
            }}
          >
            <div className="flex items-center space-x-2">
              <Shield size={20} className="text-success-500" />
              <span className="text-sm text-neutral-300">{t('upgrade.secure_payment')}</span>
            </div>
            <div className="w-px h-6" style={{ background: premiumDesign.colors.neutral[700] }} />
            <div className="flex items-center space-x-2">
              <Check size={20} className="text-success-500" />
              <span className="text-sm text-neutral-300">{t('upgrade.cancel_anytime')}</span>
            </div>
            <div className="w-px h-6" style={{ background: premiumDesign.colors.neutral[700] }} />
            <div className="flex items-center space-x-2">
              <Sparkles size={20} className="text-primary-500" />
              <span className="text-sm text-neutral-300">{t('upgrade.money_back')}</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Upgrade