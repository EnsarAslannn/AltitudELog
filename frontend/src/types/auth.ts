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
  email: string
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

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}
