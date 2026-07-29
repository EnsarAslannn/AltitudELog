import type { ApiError } from '../types/problemDetails'

/**
 * Turns an ApiError into user-facing Turkish copy.
 *
 * The API's 409s come from DomainExceptionHandler and carry raw English detail strings
 * ("Flight ... is already cancelled.", "... was modified by another request"), which otherwise
 * surfaced verbatim in an all-Turkish UI. They all mean the same thing to the user — the record
 * moved under them — so they collapse to one message, and callers should refetch alongside it.
 */
export function apiErrorMessage(error: ApiError, fallback: string): string {
  if (error.status === 409) {
    return 'Bu kayıt başka bir işlem tarafından değiştirilmiş. Sayfayı yenileyip tekrar deneyin.'
  }

  return error.detail ?? error.title ?? fallback
}
