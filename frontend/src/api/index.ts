/**
 * API client for SpaarBot backend
 */
import axios, { AxiosError } from 'axios'
import type {
  Transaction,
  Category,
  User,
  AIQuery,
  AIResponse,
} from '@/types'
import type {
  TransactionCreateRequest,
  TransactionListParams,
  CategoryAnalyticsParams,
  CategoryAnalyticsResponse,
  ApiError,
} from './types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'

const api = axios.create({
  baseURL: `${API_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Error handler
const handleApiError = (error: AxiosError<ApiError>): never => {
  const message = error.response?.data?.detail || error.message || 'Unknown error'
  console.error('API Error:', message)
  throw new Error(message)
}

// ===== AUTH =====

export const authApi = {
  getCurrentUser: async (telegramId: number): Promise<User> => {
    try {
      const { data } = await api.get<User>('/auth/me', {
        params: { telegram_id: telegramId },
      })
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },
}

// ===== TRANSACTIONS =====

export const transactionsApi = {
  list: async (params: TransactionListParams): Promise<Transaction[]> => {
    try {
      const { data } = await api.get<Transaction[]>('/transactions/', {
        params,
      })
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },

  create: async (
    transaction: TransactionCreateRequest,
    telegramId: number
  ): Promise<Transaction> => {
    try {
      const { data } = await api.post<Transaction>(
        '/transactions/',
        transaction,
        { params: { telegram_id: telegramId } }
      )
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },

  getCategoryAnalytics: async (
    params: CategoryAnalyticsParams
  ): Promise<CategoryAnalyticsResponse> => {
    try {
      const { data } = await api.get<CategoryAnalyticsResponse>(
        '/transactions/analytics/by-category',
        { params }
      )
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },
}

// ===== TELEGRAM WEB APP =====

export const twaApi = {
  getCategories: async (telegramId?: number): Promise<Category[]> => {
    try {
      const { data } = await api.get<Category[]>('/twa/data/categories', {
        params: telegramId ? { telegram_id: telegramId } : undefined,
      })
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },
}

// ===== AI ASSISTANT =====

export const aiApi = {
  query: async (query: AIQuery): Promise<AIResponse> => {
    try {
      const { data } = await api.post<AIResponse>('/ai/query', query)
      return data
    } catch (error) {
      throw handleApiError(error as AxiosError<ApiError>)
    }
  },
}

export default api