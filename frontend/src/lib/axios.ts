import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import type { AuthResponseDto, RefreshTokenRequest } from '../types/auth'
import type { ApiError, ValidationProblemDetails } from '../types/problemDetails'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// A bare axios instance for the refresh call itself — it must bypass apiClient's own
// interceptors, otherwise a failed refresh (itself a 401) would recurse back into this
// same response interceptor. Exported so tests can mock it independently of apiClient.
export const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

let navigateToLogin: (() => void) | null = null

export function setLoginRedirect(fn: () => void) {
  navigateToLogin = fn
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

// Several requests can hit a 401 for the same expired access token at once — share a
// single in-flight refresh instead of each firing its own (the second call would already
// fail, since the first rotates the refresh token server-side).
let refreshPromise: Promise<AuthResponseDto> | null = null

function refreshAccessToken(): Promise<AuthResponseDto> {
  if (!refreshPromise) {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'))
    }

    const request: RefreshTokenRequest = { refreshToken }
    refreshPromise = refreshClient
      .post<AuthResponseDto>('/Auth/refresh', request)
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined

    // Only treat a 401 as "session expired" if the request actually carried a bearer
    // token — anonymous endpoints (login, register, reset-password) can legitimately 401
    // for bad-credentials/invalid-token reasons unrelated to an active session, and must
    // not trigger a refresh attempt or a logout/redirect.
    if (error.response?.status === 401 && originalRequest?.headers?.Authorization) {
      if (!originalRequest._retried) {
        try {
          const auth = await refreshAccessToken()
          useAuthStore.getState().login(auth, useAuthStore.getState().username ?? '')

          originalRequest._retried = true
          originalRequest.headers.Authorization = `Bearer ${auth.token}`
          return apiClient(originalRequest)
        } catch {
          useAuthStore.getState().logout()
          navigateToLogin?.()
        }
      } else {
        // The retried request (already carrying a freshly-refreshed token) also got a
        // 401 — the session can't be salvaged, give up.
        useAuthStore.getState().logout()
        navigateToLogin?.()
      }
    }

    // A `responseType: 'blob'` request (e.g. file export) still gets its error body
    // back as a Blob, not parsed JSON — decode it here so toApiError sees the same
    // ProblemDetails shape it expects from every other request.
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        error.response.data = JSON.parse(text)
      } catch {
        // leave error.response.data as-is; toApiError falls back to error.message
      }
    }

    return Promise.reject(toApiError(error))
  },
)

export function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as Partial<ValidationProblemDetails> | undefined

  return {
    status: error.response?.status ?? 0,
    title: body?.title ?? error.message,
    detail: body?.detail ?? null,
    fieldErrors: body?.errors ?? null,
  }
}
