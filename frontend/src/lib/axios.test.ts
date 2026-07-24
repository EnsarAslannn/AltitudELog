import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import type { AxiosError } from 'axios'
import { apiClient, setLoginRedirect, toApiError } from './axios'
import { useAuthStore } from '../store/authStore'

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

  beforeEach(() => {
    mock = new MockAdapter(apiClient)
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    mock.restore()
  })

  it('logs out and redirects to login on a 401 for an authenticated request', async () => {
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
})
