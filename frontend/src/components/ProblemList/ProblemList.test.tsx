import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'  
import { problemsAPI } from '../../services/types'
import ProblemList from './ProblemList'

vi.mock('../../store/authStore', () => ({ // Мок useAuthStore
  useAuthStore: vi.fn()
}))

describe('ProblemList', () => {
  const mockProblems = {
    items: [
      {
        id: 1,
        type: 'pothole',
        address: 'ул. Тестовая, 1',
        description: null,
        status: 'new',
        created_at: '2024-01-01T10:00:00Z',
        reporter_id: 1,
        is_from_inspector: false,
        images_count: 0
      }
    ],
    total: 1,
    page: 1,
    limit: 10,
    total_pages: 1
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(problemsAPI.getProblems as any).mockResolvedValue({ data: mockProblems })
  })

  it('should load and display problems', async () => {
    const mockUser = {
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    ;(useAuthStore as any).mockReturnValue({ currentUser: mockUser })
    
    render(
      <BrowserRouter>
        <ProblemList />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('ул. Тестовая, 1')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    ;(problemsAPI.getProblems as any).mockImplementation(() => new Promise(() => {}))
    ;(useAuthStore as any).mockReturnValue({ currentUser: null })
    
    render(
      <BrowserRouter>
        <ProblemList />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Загрузка проблем...')).toBeInTheDocument()
  })

  it('should show error state', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {}) // подавляем вывод ожидаемой ошибки в консоль
    ;(problemsAPI.getProblems as any).mockRejectedValue(new Error('Network error'))
    ;(useAuthStore as any).mockReturnValue({ currentUser: null })
    
    render(
      <BrowserRouter>
        <ProblemList />
      </BrowserRouter>
    )
    
    await waitFor(() => {
      expect(screen.getByText('Ошибка при загрузке проблем')).toBeInTheDocument()
    })

    consoleSpy.mockRestore()
  })
})