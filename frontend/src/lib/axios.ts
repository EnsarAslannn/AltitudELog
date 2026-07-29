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

// Bumped by logout(). A refresh that was already in flight when the user signed out must not
// write its result back into the store — the tokens it returns belong to a session that no
// longer exists, and applying them silently signs the user back in.
let sessionEpoch = 0

export function invalidateInFlightRefresh() {
  sessionEpoch += 1
  refreshPromise = null
}

// Covers every way a session can end — the navbar's sign-out button, a failed refresh below, and
// a logout in another tab replayed through the storage listener — without the store having to
// import from here (it can't; this module imports the store).
useAuthStore.subscribe((state, previous) => {
  if (previous.isAuthenticated && !state.isAuthenticated) {
    invalidateInFlightRefresh()
  }
})

function refreshAccessToken(): Promise<AuthResponseDto> {
  if (!refreshPromise) {
    const refreshToken = useAuthStore.getState().refreshToken
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token available'))
    }

    const epoch = sessionEpoch
    const username = useAuthStore.getState().username ?? ''
    const request: RefreshTokenRequest = { refreshToken }

    refreshPromise = refreshClient
      .post<AuthResponseDto>('/Auth/refresh', request)
      .then((res) => {
        // The store write happens *inside* the shared promise, before it is cleared below.
        // Doing it in the awaiting caller instead left a window where refreshPromise was already
        // null but the store still held the old, now-rotated token — a 401 landing there started
        // a second refresh with a token the server had already invalidated, ending in a logout
        // mid-session.
        if (epoch === sessionEpoch) {
          useAuthStore.getState().login(res.data, username)
        }
        return res.data
      })
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
  const data = error.response?.data

  // Not every error body is ProblemDetails: PilotsController.ExportLogbook answers a bad `format`
  // with a bare string, and a proxy can return an HTML error page. Treating those as an object
  // left title undefined and threw away the real message in favour of axios's generic
  // "Request failed with status code 400".
  if (typeof data === 'string' && data.trim() !== '') {
    return {
      status: error.response?.status ?? 0,
      title: data,
      detail: null,
      fieldErrors: null,
    }
  }

  const body = data as Partial<ValidationProblemDetails> | undefined

  return {
    status: error.response?.status ?? 0,
    title: body?.title ?? error.message,
    detail: body?.detail ?? null,
    fieldErrors: body?.errors ?? null,
  }
}
