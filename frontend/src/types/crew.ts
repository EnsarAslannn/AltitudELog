export type DutyRole = 'PIC' | 'SIC' | 'Instructor' | 'Observer' | 'Trainee'

export interface CrewDto {
  id: string
  flightId: string
  pilotId: string
  pilotName: string
  dutyRole: DutyRole
}

export interface CreateCrewRequest {
  flightId: string
  pilotId: string
  dutyRole: DutyRole
}
