import axios, { type AxiosError } from 'axios'
import { useAuthStore } from '../store/authStore'
import type { ApiError, ValidationProblemDetails } from '../types/problemDetails'

export const apiClient = axios.create({
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

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Only treat a 401 as "session expired" if the request actually carried a
    // bearer token — anonymous endpoints (login, register, reset-password) can
    // legitimately 401 for bad-credentials/invalid-token reasons that have
    // nothing to do with an active session, and must not trigger a logout/redirect.
    if (error.response?.status === 401 && error.config?.headers?.Authorization) {
      useAuthStore.getState().logout()
      navigateToLogin?.()
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

function toApiError(error: AxiosError): ApiError {
  const body = error.response?.data as Partial<ValidationProblemDetails> | undefined

  return {
    status: error.response?.status ?? 0,
    title: body?.title ?? error.message,
    detail: body?.detail ?? null,
    fieldErrors: body?.errors ?? null,
  }
}
