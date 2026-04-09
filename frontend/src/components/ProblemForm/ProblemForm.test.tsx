import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import ProblemForm from './ProblemForm'
import { useAuthStore } from '../../store/authStore'

vi.mock('../../store/authStore', () => ({ // Мок useAuthStore
  useAuthStore: vi.fn()
}))

describe('ProblemForm', () => {
  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'citizen' as const,
    organization: null,
    is_active: true,
    created_at: '2024-01-01'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuthStore as any).mockReturnValue({ currentUser: mockUser })
  })

  it('should render form title', () => {
    render(
      <BrowserRouter>
        <ProblemForm />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Сообщить о проблеме')).toBeInTheDocument()
  })

  it('should render description field', () => {
    render(
      <BrowserRouter>
        <ProblemForm />
      </BrowserRouter>
    )
    
    expect(screen.getByLabelText('Дополнительное описание проблемы')).toBeInTheDocument()
  })

  it('should render submit button', () => {
    render(
      <BrowserRouter>
        <ProblemForm />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Отправить')).toBeInTheDocument()
  })

  it('should disable submit button when address is empty', () => {
    render(
      <BrowserRouter>
        <ProblemForm />
      </BrowserRouter>
    )
    
    const submitButton = screen.getByText('Отправить')
    expect(submitButton).toBeDisabled()
  })

  it('should show edit title when in edit mode', () => {
    const mockProblem = {
      id: 1,
      type: 'pothole' as const,
      address: 'ул. Тестовая, 1',
      description: null,
      status: 'new' as const,
      created_at: '2024-01-01',
      reporter_id: 1,
      is_from_inspector: false,
      images_count: 0
    }
    
    render(
      <BrowserRouter>
        <ProblemForm 
          initialData={mockProblem}
          isEditing={true}
        />
      </BrowserRouter>
    )
    
    expect(screen.getByText(/Редактировать проблему/)).toBeInTheDocument()
  })

  it('should show edit button in edit mode', () => {
    const mockProblem = {
      id: 1,
      type: 'pothole' as const,
      address: 'ул. Тестовая, 1',
      description: null,
      status: 'new' as const,
      created_at: '2024-01-01',
      reporter_id: 1,
      is_from_inspector: false,
      images_count: 0
    }
    
    render(
      <BrowserRouter>
        <ProblemForm 
          initialData={mockProblem}
          isEditing={true}
        />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Сохранить')).toBeInTheDocument()
  })
})