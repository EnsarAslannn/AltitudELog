import type { PilotRank } from './auth'
import type { DutyRole } from './crew'

export interface PilotDto {
  id: string
  name: string
  licenseNumber: string
  rank: PilotRank
  username: string
}

export interface AircraftHoursDto {
  aircraftType: string
  flightCount: number
  totalHours: string
}

export interface PilotFlightSummaryDto {
  flightId: string
  originICAO: string
  destinationICAO: string
  date: string
  flightTime: string
  aircraftType: string
  dutyRole: DutyRole
}

export interface PilotProfileDto extends PilotDto {
  totalFlights: number
  totalFlightHours: string
  hoursByAircraftType: AircraftHoursDto[]
  recentFlights: PilotFlightSummaryDto[]
  flightsLast90Days: number
  hoursLast90Days: string
  lastFlightDate: string | null
  isCurrent: boolean
  licenseExpiryDate: string | null
  medicalExpiryDate: string | null
}
