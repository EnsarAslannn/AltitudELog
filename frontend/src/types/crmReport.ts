export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface CRMReportDto {
  id: string
  flightId: string
  title: string
  description: string
  isAnonymous: boolean
  severityLevel: SeverityLevel
  createdDate: string
  reporterId: string | null
  reporterName: string | null
}

export interface CreateCRMReportRequest {
  flightId: string
  title: string
  description: string
  isAnonymous: boolean
  severityLevel: SeverityLevel
}
