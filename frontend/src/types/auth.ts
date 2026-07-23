export type PilotRank = 'Trainee' | 'FirstOfficer' | 'Captain' | 'ChiefPilot'

export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  name: string
  licenseNumber: string
  rank: PilotRank
  licenseExpiryDate?: string | null
  medicalExpiryDate?: string | null
}

export interface AuthResponseDto {
  token: string
  expiresAtUtc: string
  pilotId: string
  rank: PilotRank
}
