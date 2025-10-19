/**
 * Reusable Button component with Telegram theme integration
 */
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 active:scale-95'

    const variants = {
      primary: 'bg-telegram-button text-telegram-buttonText hover:opacity-90 active:opacity-75',
      secondary: 'bg-telegram-bg text-telegram-text border-2 border-telegram-button hover:bg-telegram-button hover:text-telegram-buttonText',
      ghost: 'bg-transparent text-telegram-link hover:bg-telegram-bg',
      danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }

    const widthClass = fullWidth ? 'w-full' : ''
    const disabledClass = disabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${disabledClass} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Laden...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'