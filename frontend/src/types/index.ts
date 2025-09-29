// Типы для проблем
export interface Problem {
  id: number;
  address: string;
  type: ProblemType;
  status: ProblemStatus;
  date: string;
  photo?: string;
  description?: string;
}

export type ProblemType = 'pothole' | 'crack' | 'manhole' | 'other';
export type ProblemStatus = 'new' | 'in_progress' | 'resolved';

// Типы для пользователя
export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  registrationDate: string;
}

export type UserRole = 'inspector' | 'contractor' | 'admin';

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