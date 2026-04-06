import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Usuario, LoginResponse } from '../types';

// Limpia la sesión anterior de localStorage (migración a sessionStorage)
if (typeof window !== 'undefined') {
  localStorage.removeItem('auth-storage');
}

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginResponse) => void;
  logout: () => void;
  updateUser: (usuario: Usuario) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: (credentials: LoginResponse) => {
        set({
          usuario: credentials.usuario,
          token: credentials.token,
          refreshToken: credentials.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          usuario: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      updateUser: (usuario: Usuario) => {
        set({ usuario });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
