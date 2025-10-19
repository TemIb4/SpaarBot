/**
 * Select dropdown component
 */
import { SelectHTMLAttributes, forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string | number; label: string; icon?: string }>
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 appearance-none bg-white'
    const normalStyles = 'border-gray-200 focus:border-telegram-button focus:ring-telegram-button/20'
    const errorStyles = 'border-red-300 focus:border-red-500 focus:ring-red-500/20'

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-telegram-text mb-1.5">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            className={`${baseStyles} ${error ? errorStyles : normalStyles} ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon && `${option.icon} `}
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-5 h-5 text-telegram-hint"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'