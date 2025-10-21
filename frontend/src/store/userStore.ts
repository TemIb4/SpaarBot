// src/store/userStore.ts

/**
 * User store - Zustand
 */
import { create } from 'zustand'
import type { User } from '@/types'

// ИСПРАВЛЕНО: Добавлены isPremium, updateUser, logout
export interface UserState {
  user: User | null
  isLoading: boolean
  error: string | null
  isPremium: boolean // <-- ДОБАВЛЕНО

  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearUser: () => void
  updateUser: (data: Partial<Pick<User, 'first_name' | 'email' | 'location'>>) => Promise<void> // <-- ДОБАВЛЕНО
  logout: () => void // <-- ДОБАВЛЕНО
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isPremium: false, // <-- ДОБАВЛЕНО начальное значение

  // ИСПРАВЛЕНО: setUser теперь также вычисляет и устанавливает isPremium
  setUser: (user) => set({ user, error: null, isPremium: user?.tier === 'premium' }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearUser: () => set({ user: null, error: null, isPremium: false }),

  // --- ДОБАВЛЕНЫ недостающие функции ---

  // Функция для обновления профиля
  updateUser: async (data) => {
    const currentUser = get().user
    if (currentUser) {
      set({ isLoading: true });
      try {
        // Здесь должен быть ваш вызов API для обновления пользователя на бекенде
        // const updatedUserFromApi = await api.updateProfile(data);

        // Имитируем успешное обновление
        const updatedUser = { ...currentUser, ...data } as User
        set({ user: updatedUser, isLoading: false });
      } catch (e) {
        set({ error: 'Failed to update user', isLoading: false });
      }
    }
  },

  // Функция для выхода из системы (если понадобится)
  logout: () => {
    // Здесь может быть логика для очистки токенов и т.д.
    set({ user: null, error: null, isPremium: false });
  },
}));