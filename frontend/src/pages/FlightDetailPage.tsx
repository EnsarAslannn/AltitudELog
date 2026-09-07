import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Ban,
  CalendarDays,
  Clock3,
  Pencil,
  Radio,
  ShieldAlert,
  UserMinus,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { flightService } from '../services/flightService'
import { crewService } from '../services/crewService'
import { crmReportService } from '../services/crmReportService'
import { CrmStatusControl } from '../components/crm/CrmStatusControl'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import { AircraftSilhouette } from '../components/ui/AircraftSilhouette'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Select } from '../components/ui/Select'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { aircraftLabel } from '../data/aircraftTypes'
import { apiErrorMessage } from '../lib/apiMessages'
import { cn } from '../lib/cn'
import { dutyRoleIcon, severityIcon, severityTone } from '../lib/domainDisplay'
import { useLocaleTag, useT } from '../i18n'
import { hasCommandRank } from '../routes/ranks'
import type { FlightDto } from '../types/flight'
import type { CrewDto, DutyRole } from '../types/crew'
import type { CRMReportDto, SeverityLevel } from '../types/crmReport'
import type { PilotDto } from '../types/pilot'
import type { ApiError } from '../types/problemDetails'

const dutyRoles: DutyRole[] = ['PIC', 'SIC', 'Instructor', 'Observer', 'Trainee']
const severityLevels: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

const severityBorder: Record<SeverityLevel, string> = {
  Low: 'border-l-success',
  Medium: 'border-l-warning',
  High: 'border-l-high',
  Critical: 'border-l-error',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function FlightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const flightId = id!
  const canCommand = useAuthStore((state) => hasCommandRank(state.rank))

  const [tab, setTab] = useState<'crew' | 'crm'>('crew')
  const [flight, setFlight] = useState<FlightDto | null>(null)
  const [crew, setCrew] = useState<CrewDto[]>([])
  const [reports, setReports] = useState<CRMReportDto[]>([])
  const [pilots, setPilots] = useState<PilotDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const t = useT()

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    Promise.all([
      flightService.getById(flightId),
      crewService.getByFlight(flightId),
      crmReportService.getByFlight(flightId),
      canCommand ? pilotService.getAll() : Promise.resolve([]),
    ])
      .then(([flightData, crewList, reportList, pilotList]) => {
        if (cancelled) return
        setFlight(flightData)
        setCrew(crewList)
        setReports(reportList)
        setPilots(pilotList)
      })
      .catch((err) => {
        if (cancelled) return
        const apiError = err as ApiError
        setError(
          apiError.status === 404 ? t('flightDetail.notFound') : (apiError.title ?? t('flightDetail.loadFailed')),
        )
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [flightId, canCommand, t])

  function refreshFlight() {
    setRefreshError(null)
    flightService
      .getById(flightId)
      .then(setFlight)
      .catch(() => setRefreshError(t('flightDetail.refreshFlightFailed')))
  }

  function refreshCrew() {
    setRefreshError(null)
    crewService
      .getByFlight(flightId)
      .then(setCrew)
      .catch(() => setRefreshError(t('flightDetail.refreshCrewFailed')))
  }

  function refreshReports() {
    setRefreshError(null)
    crmReportService
      .getByFlight(flightId)
      .then(setReports)
      .catch(() => setRefreshError(t('flightDetail.refreshReportsFailed')))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only">{t('common.loading')}</span>
        <Skeleton className="h-40 rounded-lg" />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !flight) {
    return (
      <Card className="border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? t('flightDetail.notFound')}
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rise">
        <div className="flex flex-col justify-center gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="soft" rule={false}>
              {t('flightDetail.eyebrow')}
            </Eyebrow>
            {flight.isCancelled ? (
              <Badge tone="red" icon={Ban}>
                {t('flight.cancelled')}
              </Badge>
            ) : (
              canCommand && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/flights/${flightId}/edit`}
                    className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {t('flightDetail.edit')}
                  </Link>
                  <CancelFlightControl flightId={flightId} onCancelled={refreshFlight} />
                </div>
              )
            )}
          </div>
          <RouteRibbon
            origin={flight.originICAO}
            destination={flight.destinationICAO}
            size="lg"
            emphasis="strong"
            animated
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-on-surface-variant">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span className="data">{flight.date}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              <span className="data">{flight.flightTime}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <AircraftSilhouette code={flight.aircraftType} className="h-4 w-4" />
              <span className="data">{flight.aircraftType}</span>
              {aircraftLabel(flight.aircraftType) && (
                <span>· {aircraftLabel(flight.aircraftType)}</span>
              )}
            </span>
          </div>
          {flight.metarInfo && (
            <div className="glass-panel flex items-start gap-2 rounded-lg px-4 py-3">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="eyebrow text-[10px] text-on-surface-variant">METAR</p>
                <p className="data mt-1 text-xs leading-relaxed text-on-surface">{flight.metarInfo}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {refreshError && (
        <p role="alert" className="text-sm text-error">
          {refreshError}
        </p>
      )}

      <div className="inline-flex w-fit gap-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest p-1 shadow-sm">
        <TabButton active={tab === 'crew'} onClick={() => setTab('crew')} icon={Users}>
          {t('flightDetail.tab.crew')}
        </TabButton>
        <TabButton active={tab === 'crm'} onClick={() => setTab('crm')} icon={ShieldAlert}>
          {t('flightDetail.tab.crm')}
        </TabButton>
      </div>

      {tab === 'crew' && (
        <CrewTab
          flightId={flightId}
          crew={crew}
          pilots={pilots}
          canCommand={canCommand}
          onChanged={refreshCrew}
        />
      )}
      {tab === 'crm' && (
        <CrmTab
          flightId={flightId}
          reports={reports}
          canCommand={canCommand}
          onChanged={refreshReports}
        />
      )}
    </div>
  )
}

export function CancelFlightControl({ flightId, onCancelled }: { flightId: string; onCancelled: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  async function handleConfirm() {
    setError(null)
    setIsCancelling(true)
    try {
      await flightService.cancel(flightId)
      onCancelled()
      setConfirming(false)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiErrorMessage(apiError, t, t('flightDetail.cancelFailed')))

      if (apiError.status === 409) {
        onCancelled()
      }
    } finally {
      setIsCancelling(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-on-surface">{t('flightDetail.cancelConfirmQuestion')}</span>
          <button
            onClick={handleConfirm}
            disabled={isCancelling}
            className="flex items-center gap-1.5 rounded bg-error px-3 py-1.5 text-xs font-medium text-on-error transition-colors hover:bg-error-hover disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" />
            {isCancelling ? t('flightDetail.cancelling') : t('flightDetail.cancelConfirm')}
          </button>
          <button
            onClick={() => {
              setConfirming(false)
              setError(null)
            }}
            disabled={isCancelling}
            className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
          >
            {t('flightDetail.cancelAbort')}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-xs font-medium text-error">
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
    >
      <XCircle className="h-3.5 w-3.5" />
      {t('flightDetail.cancel')}
    </button>
  )
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Users
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded px-4 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-primary text-on-primary'
          : 'border border-outline-variant bg-surface-container-low text-on-surface-variant hover:text-primary',
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  )
}

function CrewTab({
  flightId,
  crew,
  pilots,
  canCommand,
  onChanged,
}: {
  flightId: string
  crew: CrewDto[]
  pilots: PilotDto[]
  canCommand: boolean
  onChanged: () => void
}) {
  const [pilotId, setPilotId] = useState('')
  const [dutyRole, setDutyRole] = useState<DutyRole>('PIC')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useT()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await crewService.create({ flightId, pilotId, dutyRole })
      setPilotId('')
      onChanged()
    } catch (err) {
      setError((err as ApiError).detail ?? (err as ApiError).title ?? t('crew.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t('crew.assigned')}</Eyebrow>
        {crew.length === 0 && (
          <Card className="py-10 text-center text-sm text-on-surface-variant">{t('crew.empty')}</Card>
        )}
        {crew.map((member) => {
          const RoleIcon = dutyRoleIcon[member.dutyRole]
          const identity = (
            <Link
              to={`/pilots/${member.pilotId}`}
              className="group flex min-w-0 items-center gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-signal-blue/35"
            >
              <span
                className={cn(
                  'data flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  member.dutyRole === 'PIC' ? 'bg-primary text-on-primary' : 'bg-primary/10 text-primary',
                )}
              >
                {initials(member.pilotName)}
              </span>
              <span className="truncate font-medium text-on-surface transition-colors group-hover:text-primary">
                {member.pilotName}
              </span>
            </Link>
          )

          // The command view puts a select and a remove button on the row, so the whole card can no
          // longer be one link — nesting controls inside an anchor swallows their clicks.
          return (
            <Card key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              {identity}
              {canCommand ? (
                <CrewMemberControls member={member} onChanged={onChanged} />
              ) : (
                <Badge tone={member.dutyRole === 'PIC' ? 'solid' : 'neutral'} icon={RoleIcon}>
                  {member.dutyRole}
                </Badge>
              )}
            </Card>
          )
        })}
      </div>

      {canCommand && (
        <Card className="h-fit lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <UserPlus className="h-4 w-4 text-primary" />
            {t('crew.assignTitle')}
          </h2>
          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-4">
            <Select label={t('crew.pilot')} value={pilotId} onChange={(e) => setPilotId(e.target.value)} required>
              <option value="" disabled>
                {t('crew.pilotPlaceholder')}
              </option>
              {pilots.map((pilot) => (
                <option key={pilot.id} value={pilot.id}>
                  {pilot.name} ({pilot.rank})
                </option>
              ))}
            </Select>
            <Select
              label={t('crew.duty')}
              value={dutyRole}
              onChange={(e) => setDutyRole(e.target.value as DutyRole)}
            >
              {dutyRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            {error && (
              <p role="alert" className="text-sm text-error">
                {error}
              </p>
            )}
            <Button type="submit" icon={UserPlus} disabled={isSubmitting}>
              {isSubmitting ? t('crew.submitting') : t('crew.submit')}
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}

export function CrewMemberControls({
  member,
  onChanged,
}: {
  member: CrewDto
  onChanged: () => void
}) {
  const [dutyRole, setDutyRole] = useState<DutyRole>(member.dutyRole)
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  const [pending, setPending] = useState<'duty' | 'remove' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  // A 409 here means the row this control was drawn from is stale — the flight has since been
  // cancelled, or someone else changed the assignment — so refetch and let the fresh list decide
  // what is still on offer, exactly as CancelFlightControl does.
  function report(err: unknown, fallback: string) {
    const apiError = err as ApiError
    setError(apiErrorMessage(apiError, t, fallback))

    if (apiError.status === 409 || apiError.status === 404) {
      onChanged()
    }
  }

  async function handleDutyChange(next: DutyRole) {
    const previous = dutyRole
    setDutyRole(next)
    setError(null)
    setPending('duty')
    try {
      await crewService.updateDutyRole(member.id, next)
      onChanged()
    } catch (err) {
      setDutyRole(previous)
      report(err, t('crew.updateFailed'))
    } finally {
      setPending(null)
    }
  }

  async function handleRemove() {
    setError(null)
    setPending('remove')
    try {
      await crewService.remove(member.id)
      onChanged()
      setConfirmingRemove(false)
    } catch (err) {
      report(err, t('crew.removeFailed'))
    } finally {
      setPending(null)
    }
  }

  const isBusy = pending !== null

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {pending === 'duty' && (
          <span className="text-xs font-medium text-on-surface-variant">{t('crew.updating')}</span>
        )}
        <select
          aria-label={t('crew.changeDuty')}
          value={dutyRole}
          disabled={isBusy}
          onChange={(event) => handleDutyChange(event.target.value as DutyRole)}
          className="rounded border border-outline-variant bg-surface-container-lowest px-2.5 py-1.5 text-xs font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-50"
        >
          {dutyRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {confirmingRemove ? (
          <>
            <button
              onClick={handleRemove}
              disabled={isBusy}
              className="flex items-center gap-1.5 rounded bg-error px-3 py-1.5 text-xs font-medium text-on-error transition-colors hover:bg-error-hover disabled:opacity-50"
            >
              <UserMinus className="h-3.5 w-3.5" />
              {pending === 'remove' ? t('crew.removing') : t('crew.removeConfirm')}
            </button>
            <button
              onClick={() => {
                setConfirmingRemove(false)
                setError(null)
              }}
              disabled={isBusy}
              className="rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
            >
              {t('crew.removeAbort')}
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirmingRemove(true)}
            disabled={isBusy}
            className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low disabled:opacity-50"
          >
            <UserMinus className="h-3.5 w-3.5" />
            {t('crew.remove')}
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  )
}

function CrmTab({
  flightId,
  reports,
  canCommand,
  onChanged,
}: {
  flightId: string
  reports: CRMReportDto[]
  canCommand: boolean
  onChanged: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severityLevel, setSeverityLevel] = useState<SeverityLevel>('Low')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const t = useT()
  const localeTag = useLocaleTag()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await crmReportService.create({ flightId, title, description, isAnonymous, severityLevel })
      setTitle('')
      setDescription('')
      setIsAnonymous(false)
      onChanged()
    } catch (err) {
      setError((err as ApiError).detail ?? (err as ApiError).title ?? t('crm.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <Eyebrow>{t('crm.sectionTitle')}</Eyebrow>
        {reports.length === 0 && (
          <Card className="py-10 text-center text-sm text-on-surface-variant">{t('crm.empty')}</Card>
        )}
        {reports.map((report) => {
          const SeverityIcon = severityIcon[report.severityLevel]
          return (
            <Card key={report.id} className={cn('border-l-4', severityBorder[report.severityLevel])}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="font-semibold text-on-surface">{report.title}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge tone={severityTone[report.severityLevel]} icon={SeverityIcon}>
                    {report.severityLevel}
                  </Badge>
                  <CrmStatusControl
                    reportId={report.id}
                    status={report.status}
                    canReview={canCommand}
                    onChanged={onChanged}
                  />
                </div>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{report.description}</p>
              <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-outline">
                <span className="font-medium text-on-surface-variant">
                  {report.isAnonymous ? t('crm.anonymous') : (report.reporterName ?? t('crm.unknownReporter'))}
                </span>
                ·<span className="data">{new Date(report.createdDate).toLocaleString(localeTag)}</span>
                {report.updatedAtUtc && (
                  <>
                    ·
                    <span className="data">
                      {t('crm.reviewedAt', {
                        date: new Date(report.updatedAtUtc).toLocaleString(localeTag),
                      })}
                    </span>
                  </>
                )}
              </p>
            </Card>
          )
        })}
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
          <ShieldAlert className="h-4 w-4 text-primary" />
          {t('crm.newTitle')}
        </h2>
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-4">
          <Input label={t('crm.title')} name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-[11px] text-on-surface-variant">{t('crm.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <Select
            label={t('crm.severity')}
            value={severityLevel}
            onChange={(e) => setSeverityLevel(e.target.value as SeverityLevel)}
          >
            {severityLevels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-outline-variant bg-surface-container-lowest accent-primary"
            />
            {t('crm.anonymousToggle')}
          </label>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" icon={ShieldAlert} disabled={isSubmitting}>
            {isSubmitting ? t('crm.submitting') : t('crm.submit')}
          </Button>
        </form>
      </Card>
    </div>
  )
}
