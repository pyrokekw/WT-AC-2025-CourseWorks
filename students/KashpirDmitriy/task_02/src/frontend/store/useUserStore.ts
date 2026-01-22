import { create } from 'zustand'
import type { User } from '@/types/user'

interface UserState {
  user: User | null
  isLoaded: boolean
  setUser: (user: User | null) => void
  clearUser: () => void
  setLoaded: (value: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isLoaded: false,

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),

  setLoaded: (value) => set({ isLoaded: value }),
}))
