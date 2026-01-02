import axios, { AxiosInstance, AxiosError } from 'axios'

// Определяем базовый URL из переменных окружения
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const API_PREFIX = import.meta.env.VITE_API_PREFIX || '/api/v1'

// Создаем экземпляр axios с базовой конфигурацией
export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 секунд
  headers: {
    'Content-Type': 'application/json',
  },
})

// Добавляем перехватчик запросов для добавления Telegram данных
api.interceptors.request.use(
  (config) => {
    // Добавляем telegram_id если доступен
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user?.id) {
      // Добавляем в заголовки для аутентификации
      config.headers['X-Telegram-User-Id'] = tg.initDataUnsafe.user.id

      // Добавляем init_data для верификации на backend
      if (tg.initData) {
        config.headers['X-Telegram-Init-Data'] = tg.initData
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Добавляем перехватчик ответов для обработки ошибок
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // Логируем ошибку
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })

    // Обработка специфичных ошибок
    if (error.response?.status === 401) {
      // Unauthorized - редирект на логин или показ ошибки
      console.error('Unauthorized - Telegram authentication required')
    } else if (error.response?.status === 403) {
      console.error('Forbidden - Access denied')
    } else if (error.response?.status === 404) {
      console.error('Not found')
    } else if (error.response?.status === 500) {
      console.error('Server error - please try again later')
    }

    return Promise.reject(error)
  }
)

// API методы для каждого модуля
export const apiService = {
  // =========================
  // USERS
  // =========================
  users: {
    get: (telegram_id: number) =>
      api.get(`/api/v1/users/${telegram_id}`),

    create: (userData: any) =>
      api.post('/api/v1/users', userData),

    update: (telegram_id: number, data: any) =>
      api.patch(`/api/v1/users/${telegram_id}`, data),
  },

  // =========================
  // TRANSACTIONS
  // =========================
  transactions: {
    list: (telegram_id: number, params?: {
      start_date?: string
      end_date?: string
      transaction_type?: 'expense' | 'income'
      category_id?: number
    }) =>
      api.get('/api/v1/transactions', {
        params: { telegram_id, ...params }
      }),

    create: (data: {
      telegram_id: number
      amount: number
      description: string
      transaction_type: 'expense' | 'income'
      category_id?: number
      transaction_date?: string
    }) =>
      api.post('/api/v1/transactions', data),

    update: (id: number, data: any) =>
      api.put(`/api/v1/transactions/${id}`, data),

    delete: (id: number) =>
      api.delete(`/api/v1/transactions/${id}`),

    stats: (telegram_id: number, params?: {
      start_date?: string
      end_date?: string
    }) =>
      api.get('/api/v1/transactions/stats', {
        params: { telegram_id, ...params }
      }),
  },

  // =========================
  // STATISTICS
  // =========================
  stats: {
    overview: (telegram_id: number, period?: 'week' | 'month' | '3months' | 'year') =>
      api.get('/api/v1/stats/overview', {
        params: { telegram_id, period }
      }),

    trends: (telegram_id: number, params?: {
      start_date?: string
      end_date?: string
      group_by?: 'day' | 'week' | 'month'
    }) =>
      api.get('/api/v1/stats/trends', {
        params: { telegram_id, ...params }
      }),

    categories: (telegram_id: number, params?: {
      start_date?: string
      end_date?: string
      transaction_type?: 'expense' | 'income'
    }) =>
      api.get('/api/v1/stats/categories', {
        params: { telegram_id, ...params }
      }),
  },

  // =========================
  // AI
  // =========================
  ai: {
    query: (data: {
      telegram_id: number
      message: string
      language?: string
    }) =>
      api.post('/api/v1/ai/query', data),

    insights: (telegram_id: number, params?: {
      period?: string
      language?: string
    }) =>
      api.get('/api/v1/ai-insights/monthly', {
        params: { telegram_id, ...params }
      }),

    predict: (telegram_id: number) =>
      api.get('/api/v1/ai-insights/predict', {
        params: { telegram_id }
      }),

    budgetSuggestions: (telegram_id: number, params?: {
      target_savings_percent?: number
    }) =>
      api.get('/api/v1/ai-insights/budget-suggestions', {
        params: { telegram_id, ...params }
      }),

    anomalies: (telegram_id: number) =>
      api.get('/api/v1/ai-insights/anomalies', {
        params: { telegram_id }
      }),
  },

  // =========================
  // SUBSCRIPTIONS
  // =========================
  subscriptions: {
    list: (telegram_id: number, status?: 'active' | 'cancelled' | 'expired') =>
      api.get('/api/v1/subscriptions', {
        params: { telegram_id, status }
      }),

    create: (data: {
      telegram_id: number
      name: string
      icon?: string
      amount: number
      currency?: string
      billing_cycle: 'monthly' | 'yearly'
      next_billing_date: string
    }) =>
      api.post('/api/v1/subscriptions', data),

    update: (id: number, data: any) =>
      api.put(`/api/v1/subscriptions/${id}`, data),

    delete: (id: number, telegram_id: number) =>
      api.delete(`/api/v1/subscriptions/${id}`, {
        params: { telegram_id }
      }),
  },

  // =========================
  // CATEGORIES
  // =========================
  categories: {
    list: (telegram_id: number) =>
      api.get('/api/v1/categories', {
        params: { telegram_id }
      }),

    create: (data: {
      telegram_id: number
      name: string
      icon: string
      color: string
      category_type: 'expense' | 'income'
    }) =>
      api.post('/api/v1/categories', data),
  },

  // =========================
  // BANK / CSV IMPORT
  // =========================
  bank: {
    uploadCSV: (file: File, telegram_id: number, bankType?: string) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('telegram_id', telegram_id.toString())
      if (bankType) {
        formData.append('bank_type', bankType)
      }

      return api.post('/api/v1/bank/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    },

    getSupportedBanks: () =>
      api.get('/api/v1/bank/supported-banks'),

    downloadTemplate: (bankType: string) =>
      api.get(`/api/v1/bank/template/${bankType}`, {
        responseType: 'blob',
      }),
  },

  // =========================
  // ACCOUNTS (CONNECTED BANKS)
  // =========================
  accounts: {
    list: (telegram_id: number) =>
      api.get('/api/v1/accounts', {
        params: { telegram_id }
      }),

    connect: (data: {
      telegram_id: number
      bank_name: string
      account_type: string
    }) =>
      api.post('/api/v1/accounts', data),

    sync: (accountId: number, telegram_id: number) =>
      api.post(`/api/v1/accounts/${accountId}/sync`, { telegram_id }),
  },

  // =========================
  // PAYPAL
  // =========================
  paypal: {
    getAuthUrl: (telegram_id: number) =>
      api.get('/api/v1/paypal/auth-url', {
        params: { telegram_id }
      }),

    handleCallback: (code: string, state: string) =>
      api.get('/api/v1/paypal/callback', {
        params: { code, state }
      }),

    sync: (telegram_id: number) =>
      api.post('/api/v1/paypal/sync', { telegram_id }),
  },

  // =========================
  // NOTIFICATIONS
  // =========================
  notifications: {
    list: (telegram_id: number, unread_only?: boolean) =>
      api.get('/api/v1/notifications', {
        params: { telegram_id, unread_only }
      }),

    markAsRead: (id: number, telegram_id: number) =>
      api.patch(`/api/v1/notifications/${id}/read`, { telegram_id }),

    markAllAsRead: (telegram_id: number) =>
      api.post('/api/v1/notifications/mark-all-read', { telegram_id }),
  },

  // =========================
  // SETTINGS
  // =========================
  settings: {
    get: (telegram_id: number) =>
      api.get(`/api/v1/settings/${telegram_id}`),

    update: (telegram_id: number, data: any) =>
      api.patch(`/api/v1/settings/${telegram_id}`, data),
  },
}

export default api
