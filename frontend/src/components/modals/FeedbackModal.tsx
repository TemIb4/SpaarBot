import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Star } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'

interface FeedbackModalProps {
  onClose: () => void
}

export const FeedbackModal = ({ onClose }: FeedbackModalProps) => {
  // Удалили: const { t } = useLanguage()  // ✅ Убрали неиспользуемую строку
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = () => {
    console.log('Feedback submitted:', { rating, comment })
    onClose()
  }

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10"
          >
            <X size={20} className="text-neutral-400" />
          </button>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <p className="text-neutral-400 mb-3">Wie zufrieden bist du?</p>
          <div className="flex justify-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRating(star)}
              >
                <Star
                  size={32}
                  fill={star <= rating ? premiumDesign.colors.warning[500] : 'none'}
                  color={star <= rating ? premiumDesign.colors.warning[500] : premiumDesign.colors.neutral[600]}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Dein Feedback (optional)"
            rows={4}
            className="w-full px-4 py-3 rounded-xl text-white resize-none"
            style={{
              background: premiumDesign.glass.light.background,
              border: premiumDesign.glass.light.border,
            }}
          />
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={rating === 0}
          className="w-full py-4 rounded-xl font-bold text-white disabled:opacity-50"
          style={{
            background: premiumDesign.colors.gradients.primary,
          }}
        >
          Absenden
        </motion.button>
      </motion.div>
    </motion.div>
  )
}