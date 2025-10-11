import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Типы для API
export interface Problem {
  id: number;
  address: string;
  description: string | null;
  created_at: string;
}

export interface CreateProblemRequest {
  address: string;
  description?: string | null;
}

export const problemsAPI = {
  getProblems: (): Promise<{ data: Problem[] }> => 
    api.get('/problems'),
  
  createProblem: (problemData: CreateProblemRequest): Promise<{ data: Problem }> => 
    api.post('/problems', problemData),
  
  deleteProblem: (id: number): Promise<void> => 
    api.delete(`/problems/${id}`),
};

export default api;