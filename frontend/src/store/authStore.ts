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
    {
      name: AUTH_STORAGE_KEY,
      // The persisted state is trusted straight out of localStorage, so a session whose access
      // token expired while the tab was closed would render the authenticated app, fire a
      // request, get a 401, fail to refresh and only then bounce to /login — the user sees a
      // flash of the dashboard and an error card on the way out. Drop the session up front when
      // there is provably nothing left to refresh with.
      onRehydrateStorage: () => (state) => {
        if (!state?.isAuthenticated) return

        const expired = state.expiresAtUtc !== null && new Date(state.expiresAtUtc) <= new Date()
        if (expired && !state.refreshToken) {
          state.logout()
        }
      },
    },
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
