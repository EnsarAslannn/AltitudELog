import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CancelFlightControl } from './FlightDetailPage'
import { flightService } from '../services/flightService'

vi.mock('../services/flightService', () => ({
  flightService: {
    cancel: vi.fn(),
  },
}))

describe('CancelFlightControl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows an error message when cancelling the flight fails', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.cancel).mockRejectedValueOnce({
      status: 409,
      title: 'Conflict',
      detail: 'Uçuş zaten iptal edilmiş.',
      fieldErrors: null,
    } as never)
    const onCancelled = vi.fn()

    render(<CancelFlightControl flightId="flight-1" onCancelled={onCancelled} />)

    await user.click(screen.getByRole('button', { name: 'İptal Et' }))
    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Uçuş zaten iptal edilmiş.')
    expect(onCancelled).not.toHaveBeenCalled()
  })

  it('calls onCancelled and returns to the initial state when cancelling succeeds', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.cancel).mockResolvedValueOnce({} as never)
    const onCancelled = vi.fn()

    render(<CancelFlightControl flightId="flight-1" onCancelled={onCancelled} />)

    await user.click(screen.getByRole('button', { name: 'İptal Et' }))
    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    await waitFor(() => expect(onCancelled).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'İptal Et' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
