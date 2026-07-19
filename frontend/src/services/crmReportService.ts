import { apiClient } from '../lib/axios'
import type { CRMReportDto, CreateCRMReportRequest } from '../types/crmReport'

export const crmReportService = {
  getByFlight: (flightId: string) =>
    apiClient.get<CRMReportDto[]>(`/CRMReports/flight/${flightId}`).then((res) => res.data),

  create: (request: CreateCRMReportRequest) =>
    apiClient.post<string>('/CRMReports', request).then((res) => res.data),
}
