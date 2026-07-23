import type { PilotRank } from './auth'
import type { SeverityLevel } from './crmReport'

export interface StatsDto {
  totalFlights: number
  flightsThisMonth: number
  totalPilots: number
  pilotsByRank: Partial<Record<PilotRank, number>>
  totalCrmReports: number
  crmReportsBySeverity: Partial<Record<SeverityLevel, number>>
  expiringCertifications: ExpiringCertificationDto[]
  crmTrendByMonth: MonthlyCrmTrendDto[]
}

export interface ExpiringCertificationDto {
  pilotId: string
  pilotName: string
  licenseExpiryDate: string | null
  medicalExpiryDate: string | null
}

export interface MonthlyCrmTrendDto {
  year: number
  month: number
  countsBySeverity: Partial<Record<SeverityLevel, number>>
}
