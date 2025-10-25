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
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
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
}

export interface CreateProblemRequest {
  address: string;
  description?: string | null;
  type: ProblemType;
}

export type UserRole = 'inspector' | 'contractor' | 'admin';

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
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
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
};

export const authAPI = {
  login: (loginData: LoginRequest): Promise<{ data: AuthResponse }> =>
    api.post('/auth/login', loginData),
  
  register: (registerData: RegisterRequest): Promise<{ data: User }> =>
    api.post('/auth/register', registerData),
  
  getMe: (): Promise<{ data: User }> =>
    api.get('/auth/me'),
};

export default api;