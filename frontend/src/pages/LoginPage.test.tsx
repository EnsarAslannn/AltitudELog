import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { LoginPage } from './LoginPage'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import type { AuthResponseDto } from '../types/auth'

vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
  },
}))

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const authResponse: AuthResponseDto = {
  token: 'jwt-token',
  expiresAtUtc: '2026-08-01T00:00:00Z',
  pilotId: 'pilot-1',
  rank: 'Captain',
  refreshToken: 'refresh-token',
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('logs in and navigates to the dashboard on success', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockResolvedValueOnce(authResponse)

    renderLoginPage()

    await user.type(screen.getByLabelText('Kullanıcı Adı'), 'jdoe')
    await user.type(screen.getByLabelText('Şifre'), 'P@ssw0rd123!')
    await user.click(screen.getByRole('button', { name: /Giriş Yap/ }))

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    expect(authService.login).toHaveBeenCalledWith({ username: 'jdoe', password: 'P@ssw0rd123!' })
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().rank).toBe('Captain')
  })

  it('renders the form on an opaque card over the auth backdrop clip', () => {
    renderLoginPage()

    // The clip is decorative; the guarantee that matters is that the fields sit on
    // a solid surface rather than on moving footage, so their labels and errors
    // never depend on which frame is playing.
    expect(document.querySelector('video')).toHaveAttribute('src', '/videos/air-auth.mp4')
    expect(screen.getByLabelText('Kullanıcı Adı').closest('.bg-surface')).not.toBeNull()
  })

  it('shows an error message when login fails', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.login).mockRejectedValueOnce({
      status: 401,
      title: 'Unauthorized',
      detail: 'Kullanıcı adı veya şifre hatalı.',
      fieldErrors: null,
    })

    renderLoginPage()

    await user.type(screen.getByLabelText('Kullanıcı Adı'), 'jdoe')
    await user.type(screen.getByLabelText('Şifre'), 'wrong-password')
    await user.click(screen.getByRole('button', { name: /Giriş Yap/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Kullanıcı adı veya şifre hatalı.')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
