import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '../store/authStore'

describe('AuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth() // сброс store перед каждым тестом
  })

  it('should initialize with null user', () => {
    const state = useAuthStore.getState()
    expect(state.currentUser).toBeNull()
    // loading по умолчанию true, но после clearAuth становится false. Проверяем это
    expect(state.loading).toBe(false) 
  })

  it('should set user correctly', () => {
    const mockUser = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    useAuthStore.getState().setUser(mockUser)
    expect(useAuthStore.getState().currentUser).toEqual(mockUser)
  })

  it('should clear auth data', () => {
    const mockUser = {
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    useAuthStore.getState().setUser(mockUser)
    useAuthStore.getState().clearAuth()
    
    expect(useAuthStore.getState().currentUser).toBeNull()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('should set tokens', () => {
    useAuthStore.getState().setTokens('access123', 'refresh456')
    
    expect(useAuthStore.getState().token).toBe('access123')
    expect(useAuthStore.getState().refreshToken).toBe('refresh456')
  })
})