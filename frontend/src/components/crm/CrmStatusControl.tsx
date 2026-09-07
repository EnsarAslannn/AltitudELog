import { useState } from 'react'
import { Badge } from '../ui/Badge'
import { crmReportService } from '../../services/crmReportService'
import { apiErrorMessage } from '../../lib/apiMessages'
import { useT } from '../../i18n'
import { crmStatusIcon, crmStatusLabelKey, crmStatusTone } from '../../lib/domainDisplay'
import { CRM_REPORT_STATUSES, type CRMReportStatus } from '../../types/crmReport'
import type { ApiError } from '../../types/problemDetails'

/**
 * Shows where a report sits in its review, and — for a command rank — lets it be moved. The same
 * control serves the flight's CRM tab and the safety queue, so a report reads and moves the same
 * way wherever it is seen.
 */
export function CrmStatusControl({
  reportId,
  status,
  canReview,
  onChanged,
}: {
  reportId: string
  status: CRMReportStatus
  canReview: boolean
  onChanged?: () => void
}) {
  const [value, setValue] = useState<CRMReportStatus>(status)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  if (!canReview) {
    return (
      <Badge tone={crmStatusTone[status]} icon={crmStatusIcon[status]}>
        {t(crmStatusLabelKey[status])}
      </Badge>
    )
  }

  async function handleChange(next: CRMReportStatus) {
    const previous = value
    setValue(next)
    setError(null)
    setIsSaving(true)
    try {
      await crmReportService.updateStatus(reportId, next)
      onChanged?.()
    } catch (err) {
      // Put the select back where it was: the server rejected the move, so showing the new value
      // would claim a change that did not happen.
      setValue(previous)
      setError(apiErrorMessage(err as ApiError, t, t('crm.statusFailed')))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {isSaving && (
          <span className="text-xs font-medium text-on-surface-variant">{t('crm.statusUpdating')}</span>
        )}
        <select
          aria-label={t('crm.statusChange')}
          value={value}
          disabled={isSaving}
          onChange={(event) => handleChange(event.target.value as CRMReportStatus)}
          className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-50"
        >
          {CRM_REPORT_STATUSES.map((option) => (
            <option key={option} value={option}>
              {t(crmStatusLabelKey[option])}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}
