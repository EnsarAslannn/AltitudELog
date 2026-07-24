import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CommandRoute } from './CommandRoute'
import { useAuthStore } from '../store/authStore'
import type { PilotRank } from '../types/auth'

function renderCommandRoute() {
  return render(
    <MemoryRouter initialEntries={['/admin/stats']}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        <Route element={<CommandRoute />}>
          <Route path="/admin/stats" element={<div>Command Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('CommandRoute', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('redirects to /login when not authenticated', () => {
    renderCommandRoute()

    expect(screen.getByText('Login Page')).toBeInTheDocument()
  })

  it('redirects to /unauthorized for ranks below Captain', () => {
    useAuthStore.setState({ isAuthenticated: true, rank: 'FirstOfficer' as PilotRank })

    renderCommandRoute()

    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument()
  })

  it('renders the child route for a Captain', () => {
    useAuthStore.setState({ isAuthenticated: true, rank: 'Captain' as PilotRank })

    renderCommandRoute()

    expect(screen.getByText('Command Content')).toBeInTheDocument()
  })

  it('renders the child route for a ChiefPilot', () => {
    useAuthStore.setState({ isAuthenticated: true, rank: 'ChiefPilot' as PilotRank })

    renderCommandRoute()

    expect(screen.getByText('Command Content')).toBeInTheDocument()
  })
})
