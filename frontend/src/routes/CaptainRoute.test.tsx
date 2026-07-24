import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CaptainRoute } from './CaptainRoute'
import { useAuthStore } from '../store/authStore'
import type { PilotRank } from '../types/auth'

function renderCaptainRoute() {
  return render(
    <MemoryRouter initialEntries={['/flights/new']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route element={<CaptainRoute />}>
          <Route path="/flights/new" element={<div>Captain-only Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('CaptainRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to /login when not authenticated', () => {
    renderCaptainRoute()

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /unauthorized when authenticated but not a Captain', () => {
    useAuthStore.setState({ isAuthenticated: true, rank: 'Trainee' as PilotRank })

    renderCaptainRoute()

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('renders the child route when authenticated as Captain', () => {
    useAuthStore.setState({ isAuthenticated: true, rank: 'Captain' as PilotRank })

    renderCaptainRoute()

    expect(screen.getByText('Captain-only Content')).toBeInTheDocument()
  })
})
