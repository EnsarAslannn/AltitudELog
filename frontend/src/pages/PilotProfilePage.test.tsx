import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PilotProfilePage } from './PilotProfilePage'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import type { PilotProfileDto } from '../types/pilot'

vi.mock('../services/pilotService', () => ({
  pilotService: {
    getProfile: vi.fn(),
    exportLogbook: vi.fn(),
    updateCertificates: vi.fn(),
  },
}))

const profile: PilotProfileDto = {
  id: 'pilot-1',
  name: 'Test Pilot',
  licenseNumber: 'LIC-1',
  rank: 'Captain',
  username: 'testuser',
  totalFlights: 3,
  totalFlightHours: '12:00',
  hoursByAircraftType: [],
  recentFlights: [],
  flightsLast90Days: 1,
  hoursLast90Days: '4:00',
  lastFlightDate: '2026-07-01',
  isCurrent: true,
  licenseExpiryDate: null,
  medicalExpiryDate: null,
}

function renderProfile(wrapper: 'strict' | 'plain' = 'plain') {
  const tree = (
    <MemoryRouter initialEntries={['/pilots/pilot-1']}>
      <Routes>
        <Route path="/pilots/:id" element={<PilotProfilePage />} />
      </Routes>
    </MemoryRouter>
  )

  return render(wrapper === 'strict' ? <StrictMode>{tree}</StrictMode> : tree)
}

describe('PilotProfilePage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    vi.mocked(pilotService.getProfile).mockResolvedValue(profile)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('surfaces an error when the logbook export fails', async () => {
    // handleExport is wired to onClick, so before this the rejection was unhandled and the user
    // got no feedback at all — the button just settled back.
    const user = userEvent.setup()
    vi.mocked(pilotService.exportLogbook).mockRejectedValueOnce({
      status: 500,
      title: 'Uçuş kaydı indirilemedi.',
      detail: null,
      fieldErrors: null,
    } as never)

    renderProfile()
    await screen.findByText('Test Pilot')

    await user.click(screen.getByRole('button', { name: /CSV İndir/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Uçuş kaydı indirilemedi.')
  })

  it('keeps the certificate form mounted while refreshing after a save', async () => {
    // The post-save refetch used to run the initial-load path, which flips the page to its
    // full-page skeleton — unmounting the form the user had just submitted and taking focus and
    // any pending message with it.
    const user = userEvent.setup()
    useAuthStore.setState({ isAuthenticated: true, pilotId: profile.id })
    vi.mocked(pilotService.updateCertificates).mockResolvedValue({} as never)

    renderProfile()
    await screen.findByText('Test Pilot')

    const save = screen.getByRole('button', { name: /Kaydet/ })
    await user.click(save)

    await waitFor(() => expect(pilotService.getProfile).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: /Kaydet/ })).toBeInTheDocument()
    expect(screen.queryByText('Yükleniyor…')).not.toBeInTheDocument()
  })

  it('re-enables the export buttons after a failure under StrictMode', async () => {
    // StrictMode mounts, runs the cleanup, then remounts. The mounted-ref was only ever set to
    // false by that cleanup, so it stayed false for the rest of the session and the button was
    // left disabled on "İndiriliyor…" forever after the first click.
    const user = userEvent.setup()
    vi.mocked(pilotService.exportLogbook).mockRejectedValueOnce({
      status: 500,
      title: 'Uçuş kaydı indirilemedi.',
      detail: null,
      fieldErrors: null,
    } as never)

    renderProfile('strict')
    await screen.findByText('Test Pilot')

    const csvButton = screen.getByRole('button', { name: /CSV İndir/ })
    await user.click(csvButton)

    await waitFor(() =>
      expect(screen.getByRole('button', { name: /CSV İndir/ })).not.toBeDisabled(),
    )
  })
})
