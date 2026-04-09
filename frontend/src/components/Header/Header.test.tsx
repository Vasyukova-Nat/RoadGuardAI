import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Header from './Header'

import { useAuthStore } from '../../store/authStore'
const mockLogout = vi.fn()

vi.mock('../../store/authStore', () => ({
  useAuthStore: vi.fn()
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should not show admin panel button for citizen', () => {
    const mockUser = {
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    ;(useAuthStore as any).mockReturnValue({
      currentUser: mockUser,
      logout: mockLogout
    })
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    expect(screen.queryByText('Админ панель')).not.toBeInTheDocument()
  })

  it('should open logout dialog when logout button clicked', () => {
    const mockUser = {
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    ;(useAuthStore as any).mockReturnValue({
      currentUser: mockUser,
      logout: mockLogout
    })
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    fireEvent.click(screen.getByText('Выйти'))
    expect(screen.getByText('Подтверждение выхода')).toBeInTheDocument()
  })

  it('should render logo', () => {
    ;(useAuthStore as any).mockReturnValue({
      currentUser: null,
      logout: mockLogout
    })
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    expect(screen.getByText('RoadGuard AI')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    ;(useAuthStore as any).mockReturnValue({
      currentUser: null,
      logout: mockLogout
    })
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Главная')).toBeInTheDocument()
    expect(screen.getByText('Список проблем')).toBeInTheDocument()
  })

  it('should have logout button when authenticated', () => {
    const mockUser = {
      id: 1,
      name: 'Test',
      email: 'test@example.com',
      role: 'citizen' as const,
      organization: null,
      is_active: true,
      created_at: '2024-01-01'
    }
    
    ;(useAuthStore as any).mockReturnValue({
      currentUser: mockUser,
      logout: mockLogout
    })
    
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Выйти')).toBeInTheDocument()
  })
})