/**
 * Dropdown Component
 */
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DropdownOption {
  label: string
  value: string | number
  icon?: string
}

interface DropdownProps {
  options: DropdownOption[]
  value: string | number
  onChange: (value: string | number) => void
  placeholder?: string
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Wählen...',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} className="relative z-50"> {/* ✅ Добавили z-50 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-xl font-medium flex items-center justify-between transition-all shadow-md" // ✅ Добавили shadow
        style={{
          backgroundColor: 'var(--color-card)',
          color: 'var(--color-text)',
          border: '2px solid var(--color-accent)', // ✅ Яркая граница
        }}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <span className="text-xl">{selectedOption.icon}</span>}
          <span className="font-semibold">{selectedOption?.label || placeholder}</span>
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-xl"
          style={{ color: 'var(--color-accent)' }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute w-full mt-2 rounded-xl shadow-2xl overflow-hidden" // ✅ shadow-2xl
            style={{
              backgroundColor: 'var(--color-card)',
              border: '2px solid var(--color-accent)', // ✅ Яркая граница
              backdropFilter: 'blur(10px)', // ✅ Размытие фона
            }}
          >
            {options.map((option, index) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className="w-full px-4 py-3 text-left flex items-center gap-3 transition-all"
                style={{
                  color: 'var(--color-text)',
                  backgroundColor: option.value === value ? 'var(--color-card-hover)' : 'transparent',
                  fontWeight: option.value === value ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-card-hover)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = option.value === value ? 'var(--color-card-hover)' : 'transparent'
                }}
              >
                {option.icon && <span className="text-2xl">{option.icon}</span>}
                <span>{option.label}</span>
                {option.value === value && (
                  <span className="ml-auto text-lg" style={{ color: 'var(--color-accent)' }}>✓</span>
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}