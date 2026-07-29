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

  it('reports a 409 in Turkish and refetches so the stale action goes away', async () => {
    const user = userEvent.setup()
    // DomainExceptionHandler's 409 detail is raw English ("Flight ... is already cancelled."),
    // which used to be rendered verbatim in an otherwise Turkish UI — and the page kept offering
    // a Cancel button for a flight that was already cancelled.
    vi.mocked(flightService.cancel).mockRejectedValueOnce({
      status: 409,
      title: 'Conflict',
      detail: "Flight 'flight-1' is already cancelled.",
      fieldErrors: null,
    } as never)
    const onCancelled = vi.fn()

    render(<CancelFlightControl flightId="flight-1" onCancelled={onCancelled} />)

    await user.click(screen.getByRole('button', { name: 'İptal Et' }))
    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Bu kayıt başka bir işlem tarafından değiştirilmiş.')
    expect(alert).not.toHaveTextContent('already cancelled')
    await waitFor(() => expect(onCancelled).toHaveBeenCalledTimes(1))
  })

  it('surfaces a non-conflict error as-is and does not refetch', async () => {
    const user = userEvent.setup()
    vi.mocked(flightService.cancel).mockRejectedValueOnce({
      status: 500,
      title: 'Uçuş iptal edilemedi.',
      detail: null,
      fieldErrors: null,
    } as never)
    const onCancelled = vi.fn()

    render(<CancelFlightControl flightId="flight-1" onCancelled={onCancelled} />)

    await user.click(screen.getByRole('button', { name: 'İptal Et' }))
    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Uçuş iptal edilemedi.')
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
