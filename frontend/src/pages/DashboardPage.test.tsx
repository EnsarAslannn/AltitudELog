import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from './DashboardPage'
import { flightService } from '../services/flightService'
import type { FlightsPageResult } from '../types/flight'

vi.mock('../services/flightService', () => ({
  flightService: {
    getAll: vi.fn(),
  },
}))

function flight(id: string, aircraftType: string) {
  return {
    id,
    originICAO: 'LTFM',
    destinationICAO: 'EGLL',
    flightTime: '04:00:00',
    aircraftType,
    date: '2026-07-01',
    metarInfo: null,
    isCancelled: false,
  }
}

const page1: FlightsPageResult = {
  items: [flight('1', 'A350')],
  totalCount: 21,
  pageNumber: 1,
  pageSize: 20,
  thisMonthCount: 5,
  distinctAircraftTypeCount: 3,
}

const page2: FlightsPageResult = {
  items: [flight('2', 'B777')],
  totalCount: 21,
  pageNumber: 2,
  pageSize: 20,
  thisMonthCount: 5,
  distinctAircraftTypeCount: 3,
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('fetches page 1 on mount and renders its flights and stats', async () => {
    vi.mocked(flightService.getAll).mockResolvedValueOnce(page1)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('A350')).toBeInTheDocument()
    expect(flightService.getAll).toHaveBeenCalledWith(1, 20)
    expect(screen.getByText('Sayfa 1 / 2')).toBeInTheDocument()
  })

  it('fetches the next page when "Sonraki" is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.getAll).mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await screen.findByText('A350')

    await user.click(screen.getByRole('button', { name: /Sonraki/ }))

    expect(await screen.findByText('B777')).toBeInTheDocument()
    await waitFor(() => expect(flightService.getAll).toHaveBeenCalledWith(2, 20))
    expect(screen.getByText('Sayfa 2 / 2')).toBeInTheDocument()
  })

  it('shows an error message when the fetch fails', async () => {
    vi.mocked(flightService.getAll).mockRejectedValueOnce({
      status: 500,
      title: 'Uçuşlar yüklenemedi.',
      detail: null,
      fieldErrors: null,
    } as never)

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent('Uçuşlar yüklenemedi.')
  })
})
