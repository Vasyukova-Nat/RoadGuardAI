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
          
          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Если refresh не удался, разлогиниваем пользователя
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    
    return Promise.reject(error);
  }
);

export type ProblemType = 'pothole' | 'crack' | 'manhole' | 'other';
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
  organization: string;
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

export const problemsAPI = {
  getProblems: (): Promise<{ data: Problem[] }> => 
    api.get('/problems'),
  
  createProblem: (problemData: CreateProblemRequest): Promise<{ data: Problem }> => 
    api.post('/problems', problemData),
  
  deleteProblem: (id: number): Promise<void> => 
    api.delete(`/problems/${id}`),

  updateProblemStatus: (id: number, status: ProblemStatus): Promise<{ data: Problem }> => 
    api.put(`/problems/${id}/status`, null, { params: { status } })
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