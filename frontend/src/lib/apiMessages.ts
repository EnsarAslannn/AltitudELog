import type { Translate } from '../i18n'
import type { ApiError } from '../types/problemDetails'

export function apiErrorMessage(error: ApiError, t: Translate, fallback: string): string {
  if (error.status === 409) {
    return t('api.conflict')
  }

  return error.detail ?? error.title ?? fallback
}
