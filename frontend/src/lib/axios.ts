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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      navigateToLogin?.()
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
