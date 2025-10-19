/**
 * Card component for content containers
 */
import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  padding = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-white rounded-xl shadow-sm border border-gray-100'

  const paddings = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  const hoverClass = hoverable ? 'cursor-pointer hover:shadow-md transition-shadow active:scale-98' : ''

  return (
    <div
      className={`${baseStyles} ${paddings[padding]} ${hoverClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}