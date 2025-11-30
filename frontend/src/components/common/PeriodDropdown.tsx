import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { premiumDesign } from '../../config/premiumDesign'
import { useLanguage } from '../../contexts/LanguageContext'

export type PeriodType = 'day' | 'week' | '15days' | 'month' | '3months' | '6months' | 'year' | 'alltime'

interface PeriodDropdownProps {
  selected: PeriodType
  onChange: (period: PeriodType) => void
  className?: string
}

export const PeriodDropdown: React.FC<PeriodDropdownProps> = ({
  selected,
  onChange,
  className = ''
}) => {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const periods: { value: PeriodType; label: string }[] = [
    { value: 'day', label: t('periods.day') },
    { value: 'week', label: t('periods.week') },
    { value: '15days', label: t('periods.15days') },
    { value: 'month', label: t('periods.month') },
    { value: '3months', label: t('periods.3months') },
    { value: '6months', label: t('periods.6months') },
    { value: 'year', label: t('periods.year') },
    { value: 'alltime', label: t('periods.alltime') },
  ]

  const selectedLabel = periods.find(p => p.value === selected)?.label || periods[3].label

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (period: PeriodType) => {
    onChange(period)
    setIsOpen(false)
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 rounded-xl font-semibold text-white flex items-center space-x-2 min-w-[140px] justify-between"
        style={{
          background: premiumDesign.glass.medium.background,
          border: premiumDesign.glass.medium.border,
        }}
      >
        <span className="text-sm">{selectedLabel}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={16} className="text-neutral-400" />
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 min-w-[180px] rounded-xl overflow-hidden z-50"
            style={{
              background: premiumDesign.colors.neutral[900],
              border: `1px solid ${premiumDesign.colors.neutral[800]}`,
              boxShadow: premiumDesign.effects.shadow.xl,
            }}
          >
            <div className="py-2">
              {periods.map((period) => (
                <motion.button
                  key={period.value}
                  whileHover={{ backgroundColor: `${premiumDesign.colors.primary[500]}20` }}
                  onClick={() => handleSelect(period.value)}
                  className="w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors"
                >
                  <span className={`text-sm font-medium ${
                    selected === period.value ? 'text-primary-400' : 'text-neutral-300'
                  }`}>
                    {period.label}
                  </span>
                  {selected === period.value && (
                    <Check size={16} className="text-primary-400" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}