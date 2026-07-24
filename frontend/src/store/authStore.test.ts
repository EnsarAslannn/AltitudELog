import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './authStore'
import type { AuthResponseDto } from '../types/auth'

const sampleAuth: AuthResponseDto = {
  token: 'test-token',
  expiresAtUtc: '2026-08-01T00:00:00Z',
  pilotId: 'pilot-1',
  rank: 'Captain',
}

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    window.localStorage.clear()
  })

  it('login sets token, pilot identity, rank, and marks the session authenticated', () => {
    useAuthStore.getState().login(sampleAuth, 'testuser')

    const state = useAuthStore.getState()
    expect(state.token).toBe('test-token')
    expect(state.pilotId).toBe('pilot-1')
    expect(state.username).toBe('testuser')
    expect(state.rank).toBe('Captain')
    expect(state.expiresAtUtc).toBe('2026-08-01T00:00:00Z')
    expect(state.isAuthenticated).toBe(true)
  })

  it('logout clears every field back to its initial value', () => {
    useAuthStore.getState().login(sampleAuth, 'testuser')

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.pilotId).toBeNull()
    expect(state.username).toBeNull()
    expect(state.rank).toBeNull()
    expect(state.expiresAtUtc).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('persists state to localStorage under the "altitudelog-auth" key', () => {
    useAuthStore.getState().login(sampleAuth, 'testuser')

    const raw = window.localStorage.getItem('altitudelog-auth')
    expect(raw).not.toBeNull()

    const parsed = JSON.parse(raw as string) as { state: { token: string; username: string } }
    expect(parsed.state.token).toBe('test-token')
    expect(parsed.state.username).toBe('testuser')
  })
})
