import { motion } from 'framer-motion'
import { Crown, X } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext'

interface UpgradePromptProps {
  onClose: () => void
}

export const UpgradePrompt = ({ onClose }: UpgradePromptProps) => {
  const { t } = useLanguage()
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
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
          border: `2px solid ${premiumDesign.colors.primary[500]}`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10"
        >
          <X size={20} className="text-neutral-400" />
        </button>

        <div
          className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
          style={{
            background: premiumDesign.colors.gradients.premium,
            boxShadow: premiumDesign.effects.shadow.glow,
          }}
        >
          <Crown size={40} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          {t('premium_required')}
        </h2>

        <p className="text-neutral-400 text-center mb-6">
          {t('unlock_feature')}
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            navigate('/upgrade')
            onClose()
          }}
          className="w-full px-8 py-4 rounded-xl font-bold text-white"
          style={{
            background: premiumDesign.colors.gradients.premium,
            boxShadow: premiumDesign.effects.shadow.glow,
          }}
        >
          👑 {t('get_premium')}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}