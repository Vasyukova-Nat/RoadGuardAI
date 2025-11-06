import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authAPI } from '../services/types';

interface AuthState {
  currentUser: User | null;
  loading: boolean; // флаг загрузки (показ анимации)
  token: string | null;
  refreshToken: string | null;
  
  // Синхронные действия (изменяют состояние)
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  
  // Асинхронные операции (работа с API)
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      loading: true,
      token: null,
      refreshToken: null,

      setUser: (user) => set({ currentUser: user }),
      setLoading: (loading) => set({ loading }),
      setTokens: (token, refreshToken) => {
        set({ token, refreshToken });
        // Также сохраняем в localStorage для совместимости с предыдущим кодом
        if (token) {
          localStorage.setItem('token', token);
        }
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
      },

      checkAuth: async () => {
        // Берем токены из localStorage для обратной совместимости
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        
        set({ token, refreshToken });
        
        if (token || refreshToken) {
          try {
            // Пробуем получить данные пользователя
            const response = await authAPI.getMe(); 
            set({ currentUser: response.data, loading: false });
          } catch (error) {
            if (refreshToken) { // если access токен невалиден, пробуем обновить через refresh 
              try {
                const refreshResponse = await authAPI.refreshToken({ refresh_token: refreshToken });
                const { access_token, refresh_token } = refreshResponse.data;
                
                get().setTokens(access_token, refresh_token || refreshToken); // сохраняем токены
                
                // Снова получаем данные пользователя
                const userResponse = await authAPI.getMe();
                set({ currentUser: userResponse.data, loading: false });
              } catch (refreshError) { // если refresh не сработал - разлогиниваем
                get().clearAuth(); 
              }
            } else {
              get().clearAuth();
            }
          }
        } else {
          set({ loading: false });
        }
      },

      login: async (email: string, password: string) => {
        const response = await authAPI.login({ email, password });
        const { access_token, refresh_token } = response.data;
        
        get().setTokens(access_token, refresh_token);
        
        const userResponse = await authAPI.getMe();
        set({ currentUser: userResponse.data });
      },

      register: async (email: string, name: string, password: string, role: string) => {
        await authAPI.register({ email, name, password, role });
        await get().login(email, password);
      },

      logout: async () => {
        const { refreshToken } = get();
        
        if (refreshToken) {
          try {
            await authAPI.logout({ refresh_token: refreshToken });
          } catch (error) {
            console.error('Logout error:', error);
          }
        }
        
        get().clearAuth();
      },

      clearAuth: () => {
        set({
          currentUser: null,
          token: null,
          refreshToken: null,
          loading: false
        });
        localStorage.removeItem('token'); // очищаем localStorage
        localStorage.removeItem('refreshToken');
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, // сохраняем только токены (не пользователя)
        refreshToken: state.refreshToken
      })
    }
  )
);