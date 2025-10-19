/**
 * Core application types
 */

export interface User {
  id: number
  telegram_id: number
  username?: string
  first_name?: string
  language: string
  tier: 'free' | 'premium'
  subscription_status: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  transaction_type: 'expense' | 'income'
}

export interface Transaction {
  id: number
  account_id: number
  category_id?: number
  amount: number
  description?: string
  transaction_type: 'expense' | 'income'
  transaction_date: string
  receipt_url?: string
  created_at: string
  category?: Category
}

export interface Account {
  id: number
  user_id: number
  name: string
  account_type: string
  balance: number
  currency: string
}

export interface CategoryBreakdown {
  name: string
  icon: string
  color: string
  total: number
}

export interface AIQuery {
  query: string
  user_id: number
  context?: Record<string, any>
}

export interface AIResponse {
  answer: string
  suggestions?: string[]
}

export type DateRange = {
  start: Date
  end: Date
}