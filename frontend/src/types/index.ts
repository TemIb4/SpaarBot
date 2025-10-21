// Все типы для приложения

export interface User {
  id: number
  telegram_id: number
  username?: string
  first_name: string
  tier: 'free' | 'premium'  // ✅ ДОБАВЛЕНО
  is_premium: boolean
  created_at: string
  email?: string
  location?: string
  total_transactions?: number
  categories_count?: number
  subscriptions_count?: number
}

export interface Transaction {
  id: number
  telegram_id: number
  amount: number
  description: string
  category?: string  // Строка с именем категории
  category_id?: number
  type: 'expense' | 'income'
  date: string
  created_at: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  type: 'expense' | 'income'
}

export interface Subscription {
  id: number
  name: string
  icon: string
  amount: number
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date: string
  category: string
  auto_detected: boolean
  confirmed: boolean
}

// ✅ ДОБАВЛЕНО для API
export interface AIQuery {
  query: string
  context?: string
}

export interface AIResponse {
  response: string
  suggestions?: string[]
}

export interface CategoryBreakdown {
  name: string
  total: number
  percentage: number
  count: number
  icon: string
  color: string
}

export interface NewTransactionPayload {
  telegram_id: number
  type: 'expense' | 'income'
  amount: number
  description: string
  category: string
  date: string
}