import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) { // для FormData не устанавливаем Content-Type, браузер сделает это сам
    delete config.headers['Content-Type'];
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await authAPI.refreshToken({ refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data;
          
          localStorage.setItem('token', access_token);
          if (refresh_token) {
            localStorage.setItem('refreshToken', refresh_token);
          }
          
          // Обновляем store если он доступен
          try {
            const { useAuthStore } = await import('../store/authStore');
            useAuthStore.getState().setTokens(access_token, refresh_token || refreshToken);
          } catch (e) {
            // Если store недоступен (наприм, при 1-й загрузке), продолжаем работать без него (через localStorage)
          } 
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Если refresh не удался, разлогиниваем пользователя
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          try {
            const { useAuthStore } = await import('../store/authStore');
            useAuthStore.getState().clearAuth();
          } catch (e) {
          }
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        try {
          const { useAuthStore } = await import('../store/authStore');
          useAuthStore.getState().clearAuth();
        } catch (e) {
        }
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      try {
        const { useAuthStore } = await import('../store/authStore');
        useAuthStore.getState().clearAuth();
      } catch (e) {
      }
    }
    
    return Promise.reject(error);
  }
);

export type ProblemType = 'long_crack' | 'transverse_crack' | 'alligator_crack' | 'pothole' | 'manhole' | 'other';
export type ProblemStatus = 'new' | 'in_progress' | 'resolved' | 'closed';

export interface Problem {
  id: number;
  type: ProblemType;
  address: string;
  description: string | null;
  status: ProblemStatus;
  created_at: string;
  reporter_id: number;
  is_from_inspector: boolean;
}

export interface CreateProblemRequest {
  address: string;
  description?: string | null;
  type: ProblemType;
}

export type UserRole = 'citizen' | 'inspector' | 'contractor' | 'admin';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;  
  organization: string | null;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  role: string;
  organization?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface UserStats {
  reported: number;
  inProgress: number;
  resolved: number;
}

export interface Activity {
  action: string;
  date: string;
  address: string;
}

export interface DefectDetection {
  type: ProblemType;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2]
  class_name: string; // D00, D10 и т.д
}

export interface ImageAnalysisResponse {
  defects: DefectDetection[];
  detected_types: ProblemType[];
  dominant_type: ProblemType | null;
  confidence: number | null;
}

export const problemsAPI = {
  getProblems: (): Promise<{ data: Problem[] }> => 
    api.get('/problems'),
  
  createProblem: (problemData: CreateProblemRequest): Promise<{ data: Problem }> => 
    api.post('/problems', problemData),
  
  deleteProblem: (id: number): Promise<void> => 
    api.delete(`/problems/${id}`),

  updateProblemStatus: (id: number, status: ProblemStatus): Promise<{ data: Problem }> => 
    api.put(`/problems/${id}/status`, null, { params: { status } }),

  analyzeImage: (imageFile: File): Promise<{ data: ImageAnalysisResponse }> => {
    const formData = new FormData();
    formData.append('file', imageFile);
    
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return api.post('/api/analyze-image', formData, {
      headers: {
        ...headers,
        // для FormData браузер сам установит правильный Content-Type
      },
    });
  }
};

export const authAPI = {
  login: (loginData: LoginRequest): Promise<{ data: AuthResponse }> =>
    api.post('/auth/login', loginData),
  
  register: (registerData: RegisterRequest): Promise<{ data: User }> =>
    api.post('/auth/register', registerData),
  
  refreshToken: (refreshData: RefreshTokenRequest): Promise<{ data: AuthResponse }> =>
    api.post('/auth/refresh', refreshData),
  
  logout: (logoutData: LogoutRequest): Promise<void> =>
    api.post('/auth/logout', logoutData),
  
  getMe: (): Promise<{ data: User }> =>
    api.get('/auth/me'),
};

export default api;