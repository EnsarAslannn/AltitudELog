import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import type { AxiosError } from 'axios'
import { apiClient, refreshClient, setLoginRedirect, toApiError } from './axios'
import { useAuthStore } from '../store/authStore'
import type { AuthResponseDto } from '../types/auth'

describe('toApiError', () => {
  it('normalizes a ProblemDetails/ValidationProblemDetails response body', () => {
    const error = {
      response: {
        status: 400,
        data: { title: 'Bad Request', detail: 'Invalid input', errors: { Name: ['Required'] } },
      },
      message: 'Request failed with status code 400',
    } as unknown as AxiosError

    expect(toApiError(error)).toEqual({
      status: 400,
      title: 'Bad Request',
      detail: 'Invalid input',
      fieldErrors: { Name: ['Required'] },
    })
  })

  it('falls back to the axios error message when there is no response body', () => {
    const error = {
      response: undefined,
      message: 'Network Error',
    } as unknown as AxiosError

    expect(toApiError(error)).toEqual({
      status: 0,
      title: 'Network Error',
      detail: null,
      fieldErrors: null,
    })
  })
})

describe('apiClient response interceptor', () => {
  let mock: MockAdapter
  let refreshMock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
    refreshMock = new MockAdapter(refreshClient)
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    mock.restore()
    refreshMock.restore()
  })

  it('logs out and redirects to login on a 401 for an authenticated request with no refresh token', async () => {
    useAuthStore.setState({ isAuthenticated: true, token: 'abc-token' })
    const redirect = vi.fn()
    setLoginRedirect(redirect)

    mock.onGet('/Flights').reply(401, { title: 'Unauthorized' })

    await expect(apiClient.get('/Flights')).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(redirect).toHaveBeenCalledTimes(1)

    setLoginRedirect(() => {})
  })

  it('does not log out on a 401 from an anonymous request without a bearer token', async () => {
    // No token in the auth store, so the request interceptor never attaches Authorization.
    const redirect = vi.fn()
    setLoginRedirect(redirect)

    mock.onPost('/Auth/login').reply(401, { title: 'Invalid credentials' })

    await expect(apiClient.post('/Auth/login', {})).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(redirect).not.toHaveBeenCalled()

    setLoginRedirect(() => {})
  })

  it('refreshes the access token and retries the original request on a 401', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'expired-token',
      refreshToken: 'old-refresh-token',
      username: 'testuser',
    })
    const redirect = vi.fn()
    setLoginRedirect(redirect)

    const refreshedAuth: AuthResponseDto = {
      token: 'new-token',
      refreshToken: 'new-refresh-token',
      expiresAtUtc: '2026-08-01T00:00:00Z',
      pilotId: 'pilot-1',
      rank: 'Captain',
    }

    let flightsCallCount = 0
    mock.onGet('/Flights').reply((config) => {
      flightsCallCount += 1
      if (config.headers?.Authorization === 'Bearer expired-token') {
        return [401, { title: 'Unauthorized' }]
      }
      return [200, { items: [] }]
    })
    refreshMock.onPost('/Auth/refresh').reply(200, refreshedAuth)

    const response = await apiClient.get('/Flights')

    expect(response.status).toBe(200)
    expect(flightsCallCount).toBe(2)
    expect(useAuthStore.getState().token).toBe('new-token')
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(redirect).not.toHaveBeenCalled()

    setLoginRedirect(() => {})
  })

  it('logs out and redirects to login when the refresh call itself fails', async () => {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'expired-token',
      refreshToken: 'stale-refresh-token',
      username: 'testuser',
    })
    const redirect = vi.fn()
    setLoginRedirect(redirect)

    mock.onGet('/Flights').reply(401, { title: 'Unauthorized' })
    refreshMock.onPost('/Auth/refresh').reply(401, { title: 'Invalid or expired refresh token.' })

    await expect(apiClient.get('/Flights')).rejects.toMatchObject({ status: 401 })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(redirect).toHaveBeenCalledTimes(1)

    setLoginRedirect(() => {})
  })
})
