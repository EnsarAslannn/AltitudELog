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
      isAuthenticated: false,
      login: (auth, username) =>
        set({
          token: auth.token,
          refreshToken: auth.refreshToken,
          pilotId: auth.pilotId,
          username,
          rank: auth.rank,
          expiresAtUtc: auth.expiresAtUtc,
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
          isAuthenticated: false,
        }),
    }),
    { name: AUTH_STORAGE_KEY },
  ),
)

// Keep auth state in sync across tabs: a login/logout in one tab writes to localStorage, and
// this re-reads that write into every other open tab's store instead of leaving them stale
// until their next reload/navigation.
window.addEventListener('storage', (event) => {
  if (event.key === AUTH_STORAGE_KEY) {
    useAuthStore.persist.rehydrate()
  }
})
