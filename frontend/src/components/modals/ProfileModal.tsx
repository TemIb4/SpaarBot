import { motion } from 'framer-motion'
import { X, Crown, Mail, Calendar, LogOut } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useUserStore } from '../../store/userStore'
import { useNavigate } from 'react-router-dom'

interface ProfileModalProps {
  onClose: () => void
}

export const ProfileModal = ({ onClose }: ProfileModalProps) => {
  const { user, isPremium } = useUserStore()
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
          border: `1px solid ${premiumDesign.colors.neutral[800]}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Profil</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center font-bold text-4xl mb-4"
            style={{
              background: isPremium
                ? premiumDesign.colors.gradients.premium
                : premiumDesign.colors.gradients.primary,
              boxShadow: premiumDesign.effects.shadow.xl,
            }}
          >
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {user?.first_name || 'User'}
          </h3>
          <p className="text-sm text-neutral-400">
            @{user?.username || 'spaarbot_user'}
          </p>
          {isPremium && (
            <div
              className="mt-3 px-4 py-2 rounded-xl flex items-center space-x-2"
              style={{
                background: `${premiumDesign.colors.warning[500]}20`,
                border: `1px solid ${premiumDesign.colors.warning[500]}40`,
              }}
            >
              <Crown size={16} className="text-warning-400" />
              <span className="text-sm font-semibold text-warning-400">
                Premium Member
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3 mb-6">
          <div
            className="p-4 rounded-xl flex items-center space-x-3"
            style={{
              background: premiumDesign.glass.light.background,
              border: premiumDesign.glass.light.border,
            }}
          >
            <Mail size={18} className="text-neutral-400" />
            <div>
              <div className="text-xs text-neutral-500">Email</div>
              <div className="text-sm text-white">{user?.email || 'Nicht angegeben'}</div>
            </div>
          </div>

          <div
            className="p-4 rounded-xl flex items-center space-x-3"
            style={{
              background: premiumDesign.glass.light.background,
              border: premiumDesign.glass.light.border,
            }}
          >
            <Calendar size={18} className="text-neutral-400" />
            <div>
              <div className="text-xs text-neutral-500">Mitglied seit</div>
              <div className="text-sm text-white">
                {new Date(user?.created_at || Date.now()).toLocaleDateString('de-DE')}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {!isPremium && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                navigate('/upgrade')
                onClose()
              }}
              className="w-full py-4 rounded-xl font-bold text-white"
              style={{
                background: premiumDesign.colors.gradients.premium,
                boxShadow: premiumDesign.effects.shadow.glow,
              }}
            >
              👑 Upgrade auf Premium
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 rounded-xl font-semibold flex items-center justify-center space-x-2"
            style={{
              background: premiumDesign.glass.medium.background,
              border: premiumDesign.glass.medium.border,
              color: premiumDesign.colors.danger[400],
            }}
          >
            <LogOut size={18} />
            <span>Abmelden</span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}