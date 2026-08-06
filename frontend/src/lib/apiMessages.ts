import type { ApiError } from '../types/problemDetails'

export function apiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 409) {
    return 'Bu kayıt başka bir işlem tarafından değiştirilmiş. Sayfayı yenileyip tekrar deneyin.'
  }

  return error.detail ?? error.title ?? fallback
}
