// @ts-ignore
import { createStore } from 'zustand/vanilla';
// @ts-ignore
import { persist } from 'zustand/middleware';

export interface AuthState {
  token: string | null;
  userId: string | null;
  setAuth: (token: string, userId: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const authStore = createStore<AuthState>()(
  persist(
    (set: any, get: any) => ({
      token: null,
      userId: null,
      setAuth: (token: string, userId: string) => set({ token, userId }),
      clearAuth: () => set({ token: null, userId: null }),
      isAuthenticated: () => {
        const state = get();
        return state.token !== null && state.userId !== null;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state: any) => ({ token: state.token, userId: state.userId }),
    }
  )
);