import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Ban,
  CalendarDays,
  Clock3,
  Pencil,
  Radio,
  ShieldAlert,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import { flightService } from '../services/flightService'
import { crewService } from '../services/crewService'
import { crmReportService } from '../services/crmReportService'
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
        setError(apiError.status === 404 ? 'Uçuş bulunamadı.' : (apiError.title ?? 'Uçuş bilgisi yüklenemedi.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [flightId, canCommand])

  function refreshFlight() {
    setRefreshError(null)
    flightService
      .getById(flightId)
      .then(setFlight)
      .catch(() => setRefreshError('Uçuş bilgisi güncellenemedi. Sayfayı yenileyin.'))
  }

  function refreshCrew() {
    setRefreshError(null)
    crewService
      .getByFlight(flightId)
      .then(setCrew)
      .catch(() => setRefreshError('Mürettebat listesi güncellenemedi. Sayfayı yenileyin.'))
  }

  function refreshReports() {
    setRefreshError(null)
    crmReportService
      .getByFlight(flightId)
      .then(setReports)
      .catch(() => setRefreshError('CRM raporları güncellenemedi. Sayfayı yenileyin.'))
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6" aria-busy="true">
        <span className="sr-only">Yükleniyor…</span>
        <Skeleton className="h-40 rounded-lg" />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !flight) {
    return (
      <Card className="border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? 'Uçuş bulunamadı.'}
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
              Flight Record
            </Eyebrow>
            {flight.isCancelled ? (
              <Badge tone="red" icon={Ban}>
                İptal Edildi
              </Badge>
            ) : (
              canCommand && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/flights/${flightId}/edit`}
                    className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Düzenle
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
          Mürettebat
        </TabButton>
        <TabButton active={tab === 'crm'} onClick={() => setTab('crm')} icon={ShieldAlert}>
          CRM Raporları
        </TabButton>
      </div>

      {tab === 'crew' && (
        <CrewTab
          flightId={flightId}
          crew={crew}
          pilots={pilots}
          canCommand={canCommand}
          onCreated={refreshCrew}
        />
      )}
      {tab === 'crm' && <CrmTab flightId={flightId} reports={reports} onCreated={refreshReports} />}
    </div>
  )
}

export function CancelFlightControl({ flightId, onCancelled }: { flightId: string; onCancelled: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setError(null)
    setIsCancelling(true)
    try {
      await flightService.cancel(flightId)
      onCancelled()
      setConfirming(false)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiErrorMessage(apiError, 'Uçuş iptal edilemedi.'))

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
          <span className="text-xs font-medium text-on-surface">Emin misiniz?</span>
          <button
            onClick={handleConfirm}
            disabled={isCancelling}
            className="flex items-center gap-1.5 rounded bg-error px-3 py-1.5 text-xs font-medium text-on-error transition-colors hover:bg-error-hover disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" />
            {isCancelling ? 'İptal ediliyor…' : 'Onayla'}
          </button>
          <button
            onClick={() => {
              setConfirming(false)
              setError(null)
            }}
            disabled={isCancelling}
            className="flex items-center gap-1.5 rounded border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container-low"
          >
            Vazgeç
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
      İptal Et
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
  onCreated,
}: {
  flightId: string
  crew: CrewDto[]
  pilots: PilotDto[]
  canCommand: boolean
  onCreated: () => void
}) {
  const [pilotId, setPilotId] = useState('')
  const [dutyRole, setDutyRole] = useState<DutyRole>('PIC')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await crewService.create({ flightId, pilotId, dutyRole })
      setPilotId('')
      onCreated()
    } catch (err) {
      setError((err as ApiError).detail ?? (err as ApiError).title ?? 'Mürettebat eklenemedi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <Eyebrow>Atanan Mürettebat</Eyebrow>
        {crew.length === 0 && (
          <Card className="py-10 text-center text-sm text-on-surface-variant">Henüz mürettebat atanmadı.</Card>
        )}
        {crew.map((member) => {
          const RoleIcon = dutyRoleIcon[member.dutyRole]
          return (
            <Link key={member.id} to={`/pilots/${member.pilotId}`} className="group block">
              <Card interactive className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'data flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold',
                      member.dutyRole === 'PIC'
                        ? 'bg-primary text-on-primary'
                        : 'bg-primary/10 text-primary',
                    )}
                  >
                    {initials(member.pilotName)}
                  </span>
                  <span className="font-medium text-on-surface">{member.pilotName}</span>
                </div>
                <Badge tone={member.dutyRole === 'PIC' ? 'solid' : 'neutral'} icon={RoleIcon}>
                  {member.dutyRole}
                </Badge>
              </Card>
            </Link>
          )
        })}
      </div>

      {canCommand && (
        <Card className="h-fit lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
            <UserPlus className="h-4 w-4 text-primary" />
            Mürettebat Ata
          </h2>
          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-4">
            <Select label="Pilot" value={pilotId} onChange={(e) => setPilotId(e.target.value)} required>
              <option value="" disabled>
                Pilot seçin
              </option>
              {pilots.map((pilot) => (
                <option key={pilot.id} value={pilot.id}>
                  {pilot.name} ({pilot.rank})
                </option>
              ))}
            </Select>
            <Select
              label="Görev"
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
              {isSubmitting ? 'Ekleniyor…' : 'Ata'}
            </Button>
          </form>
        </Card>
      )}
    </div>
  )
}

function CrmTab({
  flightId,
  reports,
  onCreated,
}: {
  flightId: string
  reports: CRMReportDto[]
  onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severityLevel, setSeverityLevel] = useState<SeverityLevel>('Low')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      await crmReportService.create({ flightId, title, description, isAnonymous, severityLevel })
      setTitle('')
      setDescription('')
      setIsAnonymous(false)
      onCreated()
    } catch (err) {
      setError((err as ApiError).detail ?? (err as ApiError).title ?? 'Rapor oluşturulamadı.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-3">
        <Eyebrow>CRM Raporları</Eyebrow>
        {reports.length === 0 && (
          <Card className="py-10 text-center text-sm text-on-surface-variant">Henüz CRM raporu yok.</Card>
        )}
        {reports.map((report) => {
          const SeverityIcon = severityIcon[report.severityLevel]
          return (
            <Card key={report.id} className={cn('border-l-4', severityBorder[report.severityLevel])}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-on-surface">{report.title}</p>
                <Badge tone={severityTone[report.severityLevel]} icon={SeverityIcon}>
                  {report.severityLevel}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-on-surface-variant">{report.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-outline">
                <span className="font-medium text-on-surface-variant">
                  {report.isAnonymous ? 'Anonim' : (report.reporterName ?? 'Bilinmiyor')}
                </span>
                ·<span className="data">{new Date(report.createdDate).toLocaleString()}</span>
              </p>
            </Card>
          )
        })}
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-on-surface">
          <ShieldAlert className="h-4 w-4 text-primary" />
          Yeni CRM Raporu
        </h2>
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-4">
          <Input label="Başlık" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-[11px] text-on-surface-variant">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="rounded border border-outline-variant bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <Select
            label="Ciddiyet Seviyesi"
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
            Anonim olarak gönder
          </label>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" icon={ShieldAlert} disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor…' : 'Raporu Gönder'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
