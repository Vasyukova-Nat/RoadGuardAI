import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProblemList from '../ProblemList/ProblemList'
import { useAuthStore } from '../../store/authStore'
import { problemsAPI } from '../../services/types'

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

describe('Role-based UI behavior', () => {
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

  it('should not show delete button for citizen', async () => {
    const mockCitizen = {
      id: 1,
      name: 'Citizen',
      email: 'citizen@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    ;(useAuthStore as any).mockReturnValue({ currentUser: mockCitizen })
    
    render(
      <BrowserRouter>
        <ProblemList />
      </BrowserRouter>
    )
    
    await screen.findByText('ул. Тестовая, 1')
    const deleteButtons = screen.queryAllByTitle('Удалить')
    expect(deleteButtons.length).toBe(0)
  })

  it('should show inspector badge for problems from inspector', async () => {
    const mockProblemsWithInspector = {
      items: [
        {
          id: 1,
          type: 'pothole',
          address: 'ул. Тестовая, 1',
          description: null,
          status: 'new',
          created_at: '2024-01-01T10:00:00Z',
          reporter_id: 1,
          is_from_inspector: true,  
          images_count: 0
        }
      ],
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1
    }
    
    ;(problemsAPI.getProblems as any).mockResolvedValue({ data: mockProblemsWithInspector })
    
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
    
    await screen.findByText('ул. Тестовая, 1')
    
    const inspectorBadge = screen.getByText('+') // ищем "+" (от инспектора)
    expect(inspectorBadge).toBeInTheDocument()
  })
})