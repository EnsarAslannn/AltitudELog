import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponseDto, PilotRank } from '../types/auth'

interface AuthState {
  token: string | null
  pilotId: string | null
  username: string | null
  rank: PilotRank | null
  expiresAtUtc: string | null
  isAuthenticated: boolean
  login: (auth: AuthResponseDto, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      pilotId: null,
      username: null,
      rank: null,
      expiresAtUtc: null,
      isAuthenticated: false,
      login: (auth, username) =>
        set({
          token: auth.token,
          pilotId: auth.pilotId,
          username,
          rank: auth.rank,
          expiresAtUtc: auth.expiresAtUtc,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          pilotId: null,
          username: null,
          rank: null,
          expiresAtUtc: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'altitudelog-auth' },
  ),
)
