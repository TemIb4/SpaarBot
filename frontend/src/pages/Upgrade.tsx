import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Check, Sparkles, Zap, TrendingUp, BarChart3,
  Calendar, MessageSquare, Shield, Crown, X
} from 'lucide-react'
import { premiumDesign } from '../config/premiumDesign'
import { useUserStore } from '../store/userStore'
import { useNavigate } from 'react-router-dom'

const Upgrade: React.FC = () => {
  const { isPremium } = useUserStore()
  const navigate = useNavigate()
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  const plans = {
    monthly: {
      price: 3.99,
      period: 'Monat',
      savings: null,
      priceId: 'price_monthly_premium'
    },
    yearly: {
      price: 39.99,
      period: 'Jahr',
      savings: '17%',
      priceId: 'price_yearly_premium'
    }
  }

  const features = {
    free: [
      { icon: BarChart3, text: 'Базовая статистика', included: true },
      { icon: Calendar, text: 'До 4 подписок', included: true },
      { icon: MessageSquare, text: '50 AI запросов/месяц', included: true },
      { icon: TrendingUp, text: 'Расширенная аналитика', included: false },
      { icon: Shield, text: 'Приоритетная поддержка', included: false },
      { icon: Sparkles, text: 'Неограниченные AI запросы', included: false },
    ],
    premium: [
      { icon: BarChart3, text: 'Продвинутая аналитика с AI', included: true },
      { icon: Calendar, text: 'Неограниченные подписки', included: true },
      { icon: MessageSquare, text: 'Безлимитные AI запросы', included: true },
      { icon: TrendingUp, text: 'Прогнозы и инсайты', included: true },
      { icon: Shield, text: 'Приоритетная поддержка 24/7', included: true },
      { icon: Sparkles, text: 'Ранний доступ к функциям', included: true },
      { icon: Crown, text: 'Эксклюзивные финансовые данные', included: true },
      { icon: Zap, text: 'Автоматическая категоризация', included: true },
    ]
  }

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      // TODO: Implement PayPal checkout
      const plan = plans[selectedPlan]
      console.log('Upgrading to:', plan)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Redirect to payment page or show PayPal modal
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
            Du bist bereits Premium!
          </h1>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Vielen Dank für deine Unterstützung! Du hast Zugriff auf alle Premium-Funktionen.
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
            Zu den Einstellungen
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
        {/* Header */}
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
            Upgrade auf Premium
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            Entfessle die volle Kraft von SpaarBot mit unbegrenzten Features und AI-Power
          </p>
        </div>

        {/* Plan Toggle */}
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
              Monatlich
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
              Jährlich
              {plans.yearly.savings && (
                <span
                  className="absolute -top-2 -right-2 px-2 py-0.5 text-xs font-bold rounded-full"
                  style={{
                    background: premiumDesign.colors.gradients.premium,
                    color: '#fff',
                  }}
                >
                  -{plans.yearly.savings}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Free Plan */}
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
              <h3 className="text-2xl font-bold mb-2 text-white">Free</h3>
              <div className="flex items-baseline mb-4">
                <span className="text-5xl font-bold text-white">0</span>
                <span className="text-2xl text-neutral-400 ml-2">€</span>
              </div>
              <p className="text-neutral-400">Für den Einstieg</p>
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
              Aktueller Plan
            </button>
          </motion.div>

          {/* Premium Plan */}
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
            {/* Popular Badge */}
            <div
              className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: premiumDesign.colors.gradients.premium,
                color: '#fff',
              }}
            >
              ⭐ BELIEBT
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
                Premium
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
                  Spare {plans.yearly.savings} gegenüber monatlicher Zahlung
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
                  Wird geladen...
                </span>
              ) : (
                <>
                  <Sparkles size={20} className="inline mr-2" />
                  Jetzt upgraden
                </>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Trust Badges */}
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
              <span className="text-sm text-neutral-300">Sichere Zahlung</span>
            </div>
            <div className="w-px h-6" style={{ background: premiumDesign.colors.neutral[700] }} />
            <div className="flex items-center space-x-2">
              <Check size={20} className="text-success-500" />
              <span className="text-sm text-neutral-300">Jederzeit kündbar</span>
            </div>
            <div className="w-px h-6" style={{ background: premiumDesign.colors.neutral[700] }} />
            <div className="flex items-center space-x-2">
              <Sparkles size={20} className="text-primary-500" />
              <span className="text-sm text-neutral-300">30 Tage Geld-zurück</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default Upgrade