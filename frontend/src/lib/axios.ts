import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'
import type { AuthResponseDto, RefreshTokenRequest } from '../types/auth'
import type { ApiError, ValidationProblemDetails } from '../types/problemDetails'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

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

let refreshPromise: Promise<AuthResponseDto> | null = null

let sessionEpoch = 0

export function invalidateInFlightRefresh() {
  sessionEpoch += 1
  refreshPromise = null
}

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
        useAuthStore.getState().logout()
        navigateToLogin?.()
      }
    }

    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text()
        error.response.data = JSON.parse(text)
      } catch {
      }
    }

    return Promise.reject(toApiError(error))
  },
)

export function toApiError(error: AxiosError): ApiError {
  const data = error.response?.data

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
