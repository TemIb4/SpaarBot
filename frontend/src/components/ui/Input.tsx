/**
 * Input component with validation states
 */
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      className = '',
      type = 'text',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full px-4 py-2.5 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2'
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
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-telegram-hint">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            type={type}
            className={`${baseStyles} ${error ? errorStyles : normalStyles} ${icon ? 'pl-10' : ''} ${className}`}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}

        {helperText && !error && (
          <p className="mt-1 text-sm text-telegram-hint">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'