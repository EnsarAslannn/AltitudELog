import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RegisterPage } from './RegisterPage'
import { authService } from '../services/authService'

vi.mock('../services/authService', () => ({
  authService: {
    register: vi.fn(),
  },
}))

function renderRegisterPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Ad Soyad'), 'Jane Doe')
  await user.type(screen.getByLabelText('Lisans Numarası'), 'LIC-12345')
  await user.type(screen.getByLabelText('Kullanıcı Adı'), 'jdoe')
  await user.type(screen.getByLabelText('E-posta'), 'jdoe@example.com')
  await user.type(screen.getByLabelText('Şifre'), 'P@ssw0rd123!')
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('registers and navigates to /login on success', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.register).mockResolvedValueOnce('new-pilot-id')

    renderRegisterPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Kayıt Ol/ }))

    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })

  it('maps a field-level validation error to the matching input', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.register).mockRejectedValueOnce({
      status: 400,
      title: 'Validation failed',
      detail: 'One or more validation errors occurred.',
      fieldErrors: { Username: ['Username is already taken.'] },
    })

    renderRegisterPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Kayıt Ol/ }))

    expect(await screen.findByText('Username is already taken.')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('One or more validation errors occurred.')
  })

  it('does not navigate away when registration fails', async () => {
    const user = userEvent.setup()
    vi.mocked(authService.register).mockRejectedValueOnce({
      status: 400,
      title: 'Validation failed',
      detail: 'One or more validation errors occurred.',
      fieldErrors: { Email: ['Email is not valid.'] },
    })

    renderRegisterPage()
    await fillRequiredFields(user)

    await user.click(screen.getByRole('button', { name: /Kayıt Ol/ }))

    await screen.findByText('Email is not valid.')
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
