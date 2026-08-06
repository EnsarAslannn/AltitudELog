import type { PilotRank } from '../types/auth'

const COMMAND_RANKS: readonly PilotRank[] = ['Captain', 'ChiefPilot']

export function hasCommandRank(rank: PilotRank | null): boolean {
  return rank !== null && COMMAND_RANKS.includes(rank)
}
