export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export const CRM_REPORT_STATUSES = ['Open', 'UnderReview', 'Closed'] as const

export type CRMReportStatus = (typeof CRM_REPORT_STATUSES)[number]

export interface CRMReportDto {
  id: string
  flightId: string
  title: string
  description: string
  isAnonymous: boolean
  severityLevel: SeverityLevel
  status: CRMReportStatus
  createdDate: string
  updatedAtUtc: string | null
  reporterId: string | null
  reporterName: string | null
}

/** A row of the safety-review queue: the report plus the flight it belongs to. */
export interface CRMReportListItemDto extends CRMReportDto {
  originICAO: string
  destinationICAO: string
  flightDate: string
}

export interface CRMReportsPageResult {
  items: CRMReportListItemDto[]
  totalCount: number
  pageNumber: number
  pageSize: number
  openCount: number
  underReviewCount: number
  criticalOpenCount: number
}

export const CRM_REPORT_SORT_FIELDS = ['CreatedDate', 'SeverityLevel', 'Status'] as const

export type CRMReportSortField = (typeof CRM_REPORT_SORT_FIELDS)[number]

export interface CRMReportQuery {
  pageNumber?: number
  pageSize?: number
  search?: string
  status?: CRMReportStatus
  severityLevel?: SeverityLevel
  dateFrom?: string
  dateTo?: string
  flightId?: string
  sortBy?: CRMReportSortField
  sortDescending?: boolean
}

export interface CreateCRMReportRequest {
  flightId: string
  title: string
  description: string
  isAnonymous: boolean
  severityLevel: SeverityLevel
}
