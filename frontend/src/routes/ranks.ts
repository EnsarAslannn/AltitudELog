import type { PilotRank } from '../types/auth'

// Ranks allowed to write flight/crew records and to read the command dashboard. Mirrors the
// API's [Authorize(Roles = "Captain,ChiefPilot")] gates on FlightsController, CrewController and
// StatsController — ChiefPilot outranks Captain, so a Captain-only gate would lock out the more
// senior rank. Keep the two in step.
const COMMAND_RANKS: readonly PilotRank[] = ['Captain', 'ChiefPilot']

export function hasCommandRank(rank: PilotRank | null): boolean {
  return rank !== null && COMMAND_RANKS.includes(rank)
}
