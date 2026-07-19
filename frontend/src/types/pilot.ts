import type { PilotRank } from './auth'

export interface PilotDto {
  id: string
  name: string
  licenseNumber: string
  rank: PilotRank
  username: string
}
