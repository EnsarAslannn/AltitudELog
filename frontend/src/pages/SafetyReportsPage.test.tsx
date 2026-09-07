import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { SafetyReportsPage } from './SafetyReportsPage'
import { crmReportService } from '../services/crmReportService'
import type { CRMReportsPageResult } from '../types/crmReport'

vi.mock('../services/crmReportService', () => ({
  crmReportService: {
    getAll: vi.fn(),
    updateStatus: vi.fn(),
  },
}))

function page(overrides: Partial<CRMReportsPageResult> = {}): CRMReportsPageResult {
  return {
    items: [
      {
        id: 'report-1',
        flightId: 'flight-1',
        originICAO: 'LTFM',
        destinationICAO: 'EGLL',
        flightDate: '2026-05-04',
        title: 'Runway incursion',
        description: 'Aircraft entered without clearance',
        isAnonymous: false,
        severityLevel: 'Critical',
        status: 'Open',
        createdDate: '2026-05-04T12:00:00Z',
        updatedAtUtc: null,
        reporterId: 'pilot-1',
        reporterName: 'Ada Lovelace',
      },
    ],
    totalCount: 1,
    pageNumber: 1,
    pageSize: 20,
    openCount: 1,
    underReviewCount: 0,
    criticalOpenCount: 1,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SafetyReportsPage />
    </MemoryRouter>,
  )
}

describe('SafetyReportsPage', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('lists reports from every flight with their route and severity', async () => {
    vi.mocked(crmReportService.getAll).mockResolvedValue(page())

    renderPage()

    const heading = await screen.findByRole('heading', { name: 'Runway incursion' })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText('LTFM → EGLL')).toBeInTheDocument()

    // "Critical" is also a filter option, so scope the severity badge to the report card.
    const card = heading.closest('div')!
    expect(within(card).getByText('Critical')).toBeInTheDocument()
  })

  it('asks the server for the chosen status and resets to the first page', async () => {
    const user = userEvent.setup()
    vi.mocked(crmReportService.getAll).mockResolvedValue(page())

    renderPage()
    await screen.findByText('Runway incursion')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Durum' }), 'UnderReview')

    await waitFor(() =>
      expect(crmReportService.getAll).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'UnderReview', pageNumber: 1 }),
      ),
    )
  })

  it('moves a report along its review and refetches the queue', async () => {
    const user = userEvent.setup()
    vi.mocked(crmReportService.getAll).mockResolvedValue(page())
    vi.mocked(crmReportService.updateStatus).mockResolvedValue(undefined as never)

    renderPage()
    await screen.findByText('Runway incursion')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Durumu değiştir' }), 'Closed')

    await waitFor(() => expect(crmReportService.updateStatus).toHaveBeenCalledWith('report-1', 'Closed'))
    await waitFor(() => expect(crmReportService.getAll).toHaveBeenCalledTimes(2))
  })

  it('reports a failed status change and leaves the select where it was', async () => {
    const user = userEvent.setup()
    vi.mocked(crmReportService.getAll).mockResolvedValue(page())
    vi.mocked(crmReportService.updateStatus).mockRejectedValueOnce({
      status: 500,
      title: null,
      detail: null,
      fieldErrors: null,
    } as never)

    renderPage()
    await screen.findByText('Runway incursion')

    const select = screen.getByRole('combobox', { name: 'Durumu değiştir' })
    await user.selectOptions(select, 'Closed')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Rapor durumu güncellenemedi.')
    await waitFor(() => expect(select).toHaveValue('Open'))
  })

  it('shows an empty state rather than a blank list', async () => {
    vi.mocked(crmReportService.getAll).mockResolvedValue(
      page({ items: [], totalCount: 0, openCount: 0, criticalOpenCount: 0 }),
    )

    renderPage()

    expect(await screen.findByText('Bu filtrelerle eşleşen rapor yok.')).toBeInTheDocument()
  })

  it('surfaces a load failure', async () => {
    vi.mocked(crmReportService.getAll).mockRejectedValueOnce({
      status: 500,
      title: null,
      detail: null,
      fieldErrors: null,
    } as never)

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Raporlar yüklenemedi.')).toBeInTheDocument()
  })
})
