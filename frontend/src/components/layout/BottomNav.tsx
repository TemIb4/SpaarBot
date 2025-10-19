/**
 * Bottom Navigation Component - Optimized
 */
import { useLocation, useNavigate } from 'react-router-dom'
import { memo } from 'react'

const BottomNavComponent: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const navItems = [
    { path: '/', icon: '🏠', label: 'Home' },
    { path: '/stats', icon: '📊', label: 'Stats' },
    { path: '/ai', icon: '🤖', label: 'AI' },
    { path: '/subscriptions', icon: '📅', label: 'Abos' },
    { path: '/settings', icon: '⚙️', label: 'Mehr' },
  ]

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 nav-bar" // ✅ Добавили класс
      style={{
        background: 'var(--color-card)',
        backdropFilter: 'blur(10px) saturate(120%)', // ✅ Уменьшили blur
        WebkitBackdropFilter: 'blur(10px) saturate(120%)',
        borderTop: '1px solid var(--color-border)',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)', // ✅ Упростили тень
        willChange: 'transform', // ✅ Hardware acceleration
      }}
    >
      <div className="grid grid-cols-5 h-20 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95" // ✅ Убрали motion
              style={{
                transform: isActive ? 'translateY(-1px)' : 'none', // ✅ CSS transform
              }}
            >
              {/* Active Indicator Line */}
              {isActive && (
                <div
                  className="absolute top-0"
                  style={{
                    left: '50%',
                    marginLeft: '-16px',
                    width: '32px',
                    height: '4px',
                    borderRadius: '0 0 4px 4px',
                    background: `linear-gradient(90deg, var(--color-primary), var(--color-accent))`,
                    transition: 'opacity 0.2s ease', // ✅ CSS transition
                  }}
                />
              )}

              {/* Active Background */}
              {isActive && (
                <div
                  className="absolute inset-2 rounded-2xl"
                  style={{
                    background: `linear-gradient(135deg, var(--color-primary), var(--color-accent))`,
                    opacity: 0.15,
                    transition: 'opacity 0.2s ease',
                  }}
                />
              )}

              {/* Icon */}
              <div
                className="relative z-10"
                style={{
                  transform: isActive ? 'scale(1.15)' : 'scale(1)',
                  transition: 'transform 0.2s ease',
                }}
              >
                <span className="text-2xl">{item.icon}</span>
              </div>

              {/* Label */}
              <span
                className="text-xs font-semibold relative z-10 tracking-wide"
                style={{
                  color: isActive ? 'var(--color-text)' : 'var(--color-text-secondary)',
                  fontWeight: isActive ? 700 : 600,
                  opacity: isActive ? 1 : 0.8,
                  transition: 'color 0.2s ease, opacity 0.2s ease',
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export const BottomNav = memo(BottomNavComponent) // ✅ Мемоизация