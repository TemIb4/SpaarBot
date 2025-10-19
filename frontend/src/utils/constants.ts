/**
 * Application Constants
 */

export const APP_NAME = 'SpaarBot'
export const APP_VERSION = '1.0.0'

export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  accent: '#06d6a0',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
}

export const TRANSACTION_TYPES = {
  EXPENSE: 'expense',
  INCOME: 'income',
} as const

export const TIER_LIMITS = {
  FREE: {
    transactions: 50,
    categories: 10,
  },
  PREMIUM: {
    transactions: -1, // unlimited
    categories: -1,
  },
}