/**
 * Animated Gradient Background - Optimized
 */
import { memo } from 'react'

const AnimatedBackgroundComponent: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, var(--gradient-from), var(--gradient-via), var(--gradient-to))`,
        }}
      />

      {/* ✅ Упростили анимацию - убрали motion */}
      <div
        className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full blur-2xl animate-pulse-slow" // ✅ blur-2xl вместо 3xl
        style={{
          opacity: 0.3, // ✅ Уменьшили opacity
          background: 'radial-gradient(circle, var(--gradient-from) 0%, transparent 70%)',
          animationDuration: '8s', // ✅ Медленнее анимация
        }}
      />

      <div
        className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full blur-2xl animate-pulse-slow"
        style={{
          opacity: 0.3,
          background: 'radial-gradient(circle, var(--gradient-to) 0%, transparent 70%)',
          animationDuration: '10s',
          animationDelay: '2s',
        }}
      />
    </div>
  )
}

export const AnimatedBackground = memo(AnimatedBackgroundComponent)