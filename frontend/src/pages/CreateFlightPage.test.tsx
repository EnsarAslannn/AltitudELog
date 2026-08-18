import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CreateFlightPage } from './CreateFlightPage'
import { flightService } from '../services/flightService'

vi.mock('../services/flightService', () => ({
  flightService: {
    create: vi.fn(),
  },
}))

function renderCreateFlightPage() {
  return render(
    <MemoryRouter initialEntries={['/flights/new']}>
      <Routes>
        <Route path="/flights/new" element={<CreateFlightPage />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Kalkış (ICAO)'), 'LTFM')
  await user.type(screen.getByLabelText('Varış (ICAO)'), 'EGLL')
  await user.type(screen.getByLabelText('Uçak Tipi'), 'A350')
  fireEvent.change(screen.getByLabelText('Tarih'), { target: { value: '2026-07-01' } })
  fireEvent.change(screen.getByLabelText('Uçuş Süresi'), { target: { value: '04:00' } })
}

describe('CreateFlightPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('creates the flight and navigates to the dashboard on success', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.create).mockResolvedValueOnce('new-flight-id')

    renderCreateFlightPage()
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: /Uçuşu Oluştur/ }))

    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument()
    expect(flightService.create).toHaveBeenCalledWith({
      originICAO: 'LTFM',
      destinationICAO: 'EGLL',
      flightTime: '04:00:00',
      aircraftType: 'A350',
      date: '2026-07-01',
    })
  })

  it('shows an error message and stays on the page when creation fails', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.create).mockRejectedValueOnce({
      status: 400,
      title: 'Validation failed',
      detail: 'FlightTime must be greater than zero.',
      fieldErrors: null,
    })

    renderCreateFlightPage()
    await fillForm(user)

    await user.click(screen.getByRole('button', { name: /Uçuşu Oluştur/ }))

    expect(await screen.findByText('FlightTime must be greater than zero.')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard Page')).not.toBeInTheDocument()
  })
})
