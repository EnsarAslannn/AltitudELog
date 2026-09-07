import { apiClient } from '../lib/axios'
import type {
  CRMReportDto,
  CRMReportQuery,
  CRMReportStatus,
  CRMReportsPageResult,
  CreateCRMReportRequest,
} from '../types/crmReport'

export const crmReportService = {
  getByFlight: (flightId: string) =>
    apiClient.get<CRMReportDto[]>(`/CRMReports/flight/${flightId}`).then((res) => res.data),

  getAll: (query: CRMReportQuery = {}) => {
    const params = Object.fromEntries(
      Object.entries({ pageNumber: 1, pageSize: 20, ...query }).filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      ),
    )

    return apiClient.get<CRMReportsPageResult>('/CRMReports', { params }).then((res) => res.data)
  },

  create: (request: CreateCRMReportRequest) =>
    apiClient.post<string>('/CRMReports', request).then((res) => res.data),

  updateStatus: (id: string, status: CRMReportStatus) =>
    apiClient.put<void>(`/CRMReports/${id}/status`, { status }).then((res) => res.data),
}
