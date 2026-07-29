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
  activeCount: 19,
  thisMonthCount: 5,
  distinctAircraftTypeCount: 3,
}

const page2: FlightsPageResult = {
  items: [flight('2', 'B777')],
  totalCount: 21,
  pageNumber: 2,
  pageSize: 20,
  activeCount: 19,
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
    expect(flightService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 20 }),
    )
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
    await waitFor(() =>
      expect(flightService.getAll).toHaveBeenCalledWith(expect.objectContaining({ pageNumber: 2 })),
    )
    expect(screen.getByText('Sayfa 2 / 2')).toBeInTheDocument()
  })

  it('clamps back to the last page when the list shrinks underneath it', async () => {
    const user = userEvent.setup()
    // The user is on page 2; by the time it loads, the list has shrunk to a single page. Without
    // clamping, Pagination renders nothing (it hides below two pages) and the user is stranded on
    // an empty card with no way back.
    const shrunk: FlightsPageResult = { ...page1, items: [], totalCount: 3, pageNumber: 2 }

    vi.mocked(flightService.getAll)
      .mockResolvedValueOnce(page1)
      .mockResolvedValueOnce(shrunk)
      .mockResolvedValueOnce({ ...page1, totalCount: 3 })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    await screen.findByText('A350')
    await user.click(screen.getByRole('button', { name: /Sonraki/ }))

    await waitFor(() =>
      expect(flightService.getAll).toHaveBeenLastCalledWith(expect.objectContaining({ pageNumber: 1 })),
    )
    expect(await screen.findByText('A350')).toBeInTheDocument()
  })

  it('reads filters from the URL and passes them to the API', async () => {
    // Filters live in the URL so a filtered view is shareable and survives Back.
    vi.mocked(flightService.getAll).mockResolvedValue(page1)

    render(
      <MemoryRouter initialEntries={['/?search=ltf&origin=LTFM&isCancelled=false&sortBy=FlightTime&sortDir=asc']}>
        <DashboardPage />
      </MemoryRouter>,
    )

    await screen.findByText('A350')

    expect(flightService.getAll).toHaveBeenCalledWith(
      expect.objectContaining({
        search: 'ltf',
        originICAO: 'LTFM',
        isCancelled: false,
        sortBy: 'FlightTime',
        sortDescending: false,
      }),
    )
  })

  it('offers to clear filters instead of "add your first flight" on an empty filtered list', async () => {
    // Telling someone with 200 flights to add their first one is actively misleading.
    const user = userEvent.setup()
    vi.mocked(flightService.getAll).mockResolvedValue({ ...page1, items: [], totalCount: 0 })

    render(
      <MemoryRouter initialEntries={['/?search=zzzz']}>
        <DashboardPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Bu filtrelere uyan uçuş yok.')).toBeInTheDocument()
    expect(screen.queryByText('Henüz kayıtlı uçuş yok.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Filtreleri Temizle/ }))

    await waitFor(() =>
      expect(flightService.getAll).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ search: 'zzzz' }),
      ),
    )
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
