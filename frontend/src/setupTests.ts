import '@testing-library/jest-dom'
import { vi } from 'vitest'

const localStorageMock = (() => { // Мок для localStorage
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

vi.mock('@/services/types', () => ({ // Мок для API
  problemsAPI: {
    getProblems: vi.fn(),
    createProblem: vi.fn(),
    updateProblem: vi.fn(),
    deleteProblem: vi.fn(),
    updateProblemStatus: vi.fn(),
    getImages: vi.fn(),
  },
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  }
}))