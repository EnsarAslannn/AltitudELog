import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponseDto, PilotRank } from '../types/auth'

const AUTH_STORAGE_KEY = 'altitudelog-auth'

interface AuthState {
  token: string | null
  refreshToken: string | null
  pilotId: string | null
  username: string | null
  rank: PilotRank | null
  expiresAtUtc: string | null
  refreshTokenExpiresAtUtc: string | null
  isAuthenticated: boolean
  login: (auth: AuthResponseDto, username: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      pilotId: null,
      username: null,
      rank: null,
      expiresAtUtc: null,
      refreshTokenExpiresAtUtc: null,
      isAuthenticated: false,
      login: (auth, username) =>
        set({
          token: auth.token,
          refreshToken: auth.refreshToken,
          pilotId: auth.pilotId,
          username,
          rank: auth.rank,
          expiresAtUtc: auth.expiresAtUtc,
          refreshTokenExpiresAtUtc: auth.refreshTokenExpiresAtUtc,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          refreshToken: null,
          pilotId: null,
          username: null,
          rank: null,
          expiresAtUtc: null,
          refreshTokenExpiresAtUtc: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      onRehydrateStorage: () => (state) => {
        if (!state?.isAuthenticated) return

        const now = new Date()
        const expired = state.expiresAtUtc !== null && new Date(state.expiresAtUtc) <= now
        // Sessions persisted before the API reported this field have none; for those the
        // interceptor's failed refresh remains the only signal.
        const refreshExpired =
          !!state.refreshTokenExpiresAtUtc && new Date(state.refreshTokenExpiresAtUtc) <= now
        if ((expired && !state.refreshToken) || refreshExpired) {
          state.logout()
        }
      },
    },
  ),
)

window.addEventListener('storage', (event) => {
  if (event.key === AUTH_STORAGE_KEY) {
    useAuthStore.persist.rehydrate()
  }
})
