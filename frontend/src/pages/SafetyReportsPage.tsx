import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, CircleDot, FileText, Search, X } from 'lucide-react'
import { crmReportService } from '../services/crmReportService'
import { CrmStatusControl } from '../components/crm/CrmStatusControl'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { Pagination } from '../components/ui/Pagination'
import { Select } from '../components/ui/Select'
import { SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { apiErrorMessage } from '../lib/apiMessages'
import { severityIcon, severityTone } from '../lib/domainDisplay'
import { useLocaleTag, useT } from '../i18n'
import {
  CRM_REPORT_SORT_FIELDS,
  CRM_REPORT_STATUSES,
  type CRMReportQuery,
  type CRMReportSortField,
  type CRMReportStatus,
  type CRMReportsPageResult,
  type SeverityLevel,
} from '../types/crmReport'
import type { ApiError } from '../types/problemDetails'

const severityLevels: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

const PAGE_SIZE = 20

export function SafetyReportsPage() {
  const t = useT()
  const localeTag = useLocaleTag()

  const [query, setQuery] = useState<CRMReportQuery>({ pageNumber: 1, pageSize: PAGE_SIZE })
  const [pageResult, setPageResult] = useState<CRMReportsPageResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    crmReportService
      .getAll(query)
      .then((data) => {
        if (!cancelled) setPageResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err as ApiError, t, t('safety.loadFailed')))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [query, t])

  useEffect(load, [load])

  function updateQuery(patch: Partial<CRMReportQuery>) {
    // Any filter change resets to page 1 — staying on page 4 of a narrower result set shows an
    // empty list and reads as "no reports", which is the opposite of what the filter did.
    setQuery((current) => ({ ...current, pageNumber: 1, ...patch }))
  }

  const activeFilterCount = [query.search, query.status, query.severityLevel].filter(Boolean).length
  const totalPages = pageResult ? Math.max(1, Math.ceil(pageResult.totalCount / pageResult.pageSize)) : 1

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Eyebrow>{t('safety.eyebrow')}</Eyebrow>
        <h1 className="display mt-2 text-3xl text-on-surface sm:text-4xl">{t('safety.title')}</h1>
        <p className="mt-2 text-on-surface-variant">{t('safety.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={FileText} label={t('safety.tile.total')} value={pageResult?.totalCount ?? 0} />
        <StatTile icon={CircleDot} label={t('safety.tile.open')} value={pageResult?.openCount ?? 0} />
        <StatTile
          icon={Search}
          label={t('safety.tile.underReview')}
          value={pageResult?.underReviewCount ?? 0}
        />
        <StatTile
          icon={AlertOctagon}
          label={t('safety.tile.criticalOpen')}
          value={pageResult?.criticalOpenCount ?? 0}
        />
      </div>

      <Card className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label={t('safety.filter.search')}
          name="safetySearch"
          placeholder={t('safety.filter.searchPlaceholder')}
          value={query.search ?? ''}
          onChange={(event) => updateQuery({ search: event.target.value || undefined })}
        />
        <Select
          label={t('safety.filter.status')}
          name="safetyStatus"
          value={query.status ?? ''}
          onChange={(event) =>
            updateQuery({ status: (event.target.value || undefined) as CRMReportStatus | undefined })
          }
        >
          <option value="">{t('safety.filter.all')}</option>
          {CRM_REPORT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`crm.status.${status}` as const)}
            </option>
          ))}
        </Select>
        <Select
          label={t('safety.filter.severity')}
          name="safetySeverity"
          value={query.severityLevel ?? ''}
          onChange={(event) =>
            updateQuery({
              severityLevel: (event.target.value || undefined) as SeverityLevel | undefined,
            })
          }
        >
          <option value="">{t('safety.filter.all')}</option>
          {severityLevels.map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </Select>
        <Select
          label={t('safety.filter.sort')}
          name="safetySort"
          value={query.sortBy ?? 'CreatedDate'}
          onChange={(event) => updateQuery({ sortBy: event.target.value as CRMReportSortField })}
        >
          {CRM_REPORT_SORT_FIELDS.map((field) => (
            <option key={field} value={field}>
              {t(`safety.sort.${field}` as const)}
            </option>
          ))}
        </Select>
        {activeFilterCount > 0 && (
          <div className="sm:col-span-2 lg:col-span-4">
            <Button
              variant="ghost"
              icon={X}
              onClick={() => setQuery({ pageNumber: 1, pageSize: PAGE_SIZE })}
            >
              {t('safety.filter.clear')}
            </Button>
          </div>
        )}
      </Card>

      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {!isLoading && pageResult?.items.length === 0 && (
        <Card className="py-16 text-center text-sm text-on-surface-variant">{t('safety.empty')}</Card>
      )}

      {!isLoading && pageResult && pageResult.items.length > 0 && (
        <div className="flex flex-col gap-3">
          {pageResult.items.map((report) => {
            const SeverityIcon = severityIcon[report.severityLevel]
            return (
              <Card key={report.id} className="flex flex-col gap-3 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={severityTone[report.severityLevel]} icon={SeverityIcon}>
                        {report.severityLevel}
                      </Badge>
                      <h2 className="font-semibold text-on-surface">{report.title}</h2>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-on-surface-variant">
                      {report.description}
                    </p>
                  </div>
                  <CrmStatusControl
                    reportId={report.id}
                    status={report.status}
                    canReview
                    onChanged={load}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                  <Link
                    to={`/flights/${report.flightId}`}
                    className="data font-medium text-primary hover:underline"
                  >
                    {report.originICAO} → {report.destinationICAO}
                  </Link>
                  <span>{new Date(report.createdDate).toLocaleString(localeTag)}</span>
                  <span>{report.isAnonymous ? t('crm.anonymous') : report.reporterName}</span>
                  {report.updatedAtUtc && (
                    <span>
                      {t('crm.reviewedAt', {
                        date: new Date(report.updatedAtUtc).toLocaleString(localeTag),
                      })}
                    </span>
                  )}
                </div>
              </Card>
            )
          })}

          <Pagination
            pageNumber={pageResult.pageNumber}
            totalPages={totalPages}
            onPageChange={(pageNumber) => setQuery((current) => ({ ...current, pageNumber }))}
          />
        </div>
      )}
    </div>
  )
}
