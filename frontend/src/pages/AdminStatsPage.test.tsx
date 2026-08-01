import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AdminStatsPage } from './AdminStatsPage'
import { statsService } from '../services/statsService'
import type { StatsDto } from '../types/stats'

vi.mock('../services/statsService', () => ({
  statsService: {
    getStats: vi.fn(),
  },
}))

const stats: StatsDto = {
  totalFlights: 42,
  flightsThisMonth: 7,
  totalPilots: 12,
  pilotsByRank: { Trainee: 3, FirstOfficer: 4, Captain: 4, ChiefPilot: 1 },
  totalCrmReports: 9,
  crmReportsBySeverity: { Low: 4, Medium: 3, High: 1, Critical: 1 },
  expiringCertifications: [],
  crmTrendByMonth: [
    { year: 2026, month: 6, countsBySeverity: { Low: 2, Medium: 1 } },
    { year: 2026, month: 7, countsBySeverity: { Low: 1, High: 1, Critical: 1 } },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminStatsPage />
    </MemoryRouter>,
  )
}

describe('AdminStatsPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders a loading skeleton initially', () => {
    vi.mocked(statsService.getStats).mockReturnValue(new Promise(() => {}))

    renderPage()

    expect(screen.getByText('Yükleniyor…')).toBeInTheDocument()
  })

  it('renders stats tiles when data loads', async () => {
    vi.mocked(statsService.getStats).mockResolvedValue(stats)

    renderPage()

    expect(await screen.findByText('Toplam Uçuş')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Toplam Pilot')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('renders the CRM trend chart', async () => {
    vi.mocked(statsService.getStats).mockResolvedValue(stats)

    renderPage()

    expect(await screen.findByRole('img', { name: /CRM raporları/ })).toBeInTheDocument()
  })

  it('shows an error message on API failure', async () => {
    vi.mocked(statsService.getStats).mockRejectedValueOnce({
      status: 500,
      title: 'İstatistikler yüklenemedi.',
      detail: null,
      fieldErrors: null,
    } as never)

    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('İstatistikler yüklenemedi.')
  })
})
