/**
 * API request/response types
 */

export interface ApiError {
  detail: string
  status?: number
}

export interface TransactionCreateRequest {
  account_id: number
  amount: number
  description?: string
  category_id?: number
  transaction_type: 'expense' | 'income'
  transaction_date: string
}

export interface TransactionListParams {
  telegram_id: number
  start_date?: string
  end_date?: string
  category_id?: number
  limit?: number
}

export interface CategoryAnalyticsParams {
  telegram_id: number
  start_date?: string
  end_date?: string
}

export interface CategoryAnalyticsResponse {
  data: Array<{
    name: string
    icon: string
    color: string
    total: number
  }>
  start_date: string
  end_date: string
}