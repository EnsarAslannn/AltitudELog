import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CancelFlightControl, CrewMemberControls } from './FlightDetailPage'
import { flightService } from '../services/flightService'
import { crewService } from '../services/crewService'

vi.mock('../services/flightService', () => ({
  flightService: {
    cancel: vi.fn(),
  },
}))

vi.mock('../services/crewService', () => ({
  crewService: {
    updateDutyRole: vi.fn(),
    remove: vi.fn(),
  },
}))

describe('CancelFlightControl', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports a 409 in Turkish and refetches so the stale action goes away', async () => {
    const user = userEvent.setup()
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

describe('CrewMemberControls', () => {
  const member = {
    id: 'crew-1',
    flightId: 'flight-1',
    pilotId: 'pilot-1',
    pilotName: 'Ada Lovelace',
    dutyRole: 'SIC',
  } as const

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('changes the duty role and refetches', async () => {
    const user = userEvent.setup()
    vi.mocked(crewService.updateDutyRole).mockResolvedValueOnce(undefined as never)
    const onChanged = vi.fn()

    render(<CrewMemberControls member={{ ...member }} onChanged={onChanged} />)

    await user.selectOptions(screen.getByRole('combobox', { name: 'Görev değiştir' }), 'PIC')

    await waitFor(() => expect(crewService.updateDutyRole).toHaveBeenCalledWith('crew-1', 'PIC'))
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
  })

  it('rolls the select back and reports the error when the update fails', async () => {
    const user = userEvent.setup()
    vi.mocked(crewService.updateDutyRole).mockRejectedValueOnce({
      status: 500,
      title: null,
      detail: null,
      fieldErrors: null,
    } as never)
    const onChanged = vi.fn()

    render(<CrewMemberControls member={{ ...member }} onChanged={onChanged} />)

    const select = screen.getByRole('combobox', { name: 'Görev değiştir' })
    await user.selectOptions(select, 'PIC')

    expect(await screen.findByRole('alert')).toHaveTextContent('Görev güncellenemedi.')
    await waitFor(() => expect(select).toHaveValue('SIC'))
    expect(onChanged).not.toHaveBeenCalled()
  })

  it('removes the member only after the removal is confirmed', async () => {
    const user = userEvent.setup()
    vi.mocked(crewService.remove).mockResolvedValueOnce(undefined as never)
    const onChanged = vi.fn()

    render(<CrewMemberControls member={{ ...member }} onChanged={onChanged} />)

    await user.click(screen.getByRole('button', { name: 'Çıkar' }))
    expect(crewService.remove).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    await waitFor(() => expect(crewService.remove).toHaveBeenCalledWith('crew-1'))
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Çıkar' })).toBeInTheDocument()
  })

  it('refetches on a 409 so the stale row goes away', async () => {
    const user = userEvent.setup()
    vi.mocked(crewService.remove).mockRejectedValueOnce({
      status: 409,
      title: 'Conflict',
      detail: "Flight 'flight-1' is cancelled and its crew cannot be changed.",
      fieldErrors: null,
    } as never)
    const onChanged = vi.fn()

    render(<CrewMemberControls member={{ ...member }} onChanged={onChanged} />)

    await user.click(screen.getByRole('button', { name: 'Çıkar' }))
    await user.click(screen.getByRole('button', { name: 'Onayla' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Bu kayıt başka bir işlem tarafından değiştirilmiş.')
    expect(alert).not.toHaveTextContent('is cancelled')
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1))
  })
})
