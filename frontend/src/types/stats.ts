import type { PilotRank } from './auth'
import type { SeverityLevel } from './crmReport'

export interface StatsDto {
  totalFlights: number
  flightsThisMonth: number
  totalPilots: number
  pilotsByRank: Partial<Record<PilotRank, number>>
  totalCrmReports: number
  crmReportsBySeverity: Partial<Record<SeverityLevel, number>>
}
