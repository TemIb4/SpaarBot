import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

interface PremiumGateProps {
  children: ReactNode
  feature?: string
}

export const PremiumGate = ({ children, feature }: PremiumGateProps) => {
  const { isPremium } = useUserStore()
  const { t } = useLanguage()
  const navigate = useNavigate()

  if (isPremium) {
    return <>{children}</>
  }

  return (
    <div
      className="rounded-3xl p-8 text-center"
      style={{
        background: premiumDesign.colors.neutral[900],
        border: `2px solid ${premiumDesign.colors.primary[500]}`,
      }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
        style={{
          background: premiumDesign.colors.gradients.premium,
          boxShadow: premiumDesign.effects.shadow.glow,
        }}
      >
        <Crown size={40} className="text-white" />
      </motion.div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {t('premium_required')}
      </h2>

      <p className="text-neutral-400 mb-6">
        {feature ? `${feature} ${t('unlock_feature')}` : t('unlock_feature')}
      </p>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/upgrade')}
        className="px-8 py-4 rounded-xl font-bold text-white"
        style={{
          background: premiumDesign.colors.gradients.premium,
          boxShadow: premiumDesign.effects.shadow.glow,
        }}
      >
        👑 {t('get_premium')}
      </motion.button>
    </div>
  )
}