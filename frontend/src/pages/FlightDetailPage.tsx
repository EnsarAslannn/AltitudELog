import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  Ban,
  CalendarDays,
  Clock3,
  Crown,
  Eye,
  GraduationCap,
  Info,
  Pencil,
  Radio,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react'
import { flightService } from '../services/flightService'
import { crewService } from '../services/crewService'
import { crmReportService } from '../services/crmReportService'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Select } from '../components/ui/Select'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { cn } from '../lib/cn'
import type { FlightDto } from '../types/flight'
import type { CrewDto, DutyRole } from '../types/crew'
import type { CRMReportDto, SeverityLevel } from '../types/crmReport'
import type { PilotDto } from '../types/pilot'
import type { ApiError } from '../types/problemDetails'

const dutyRoles: DutyRole[] = ['PIC', 'SIC', 'Instructor', 'Observer', 'Trainee']
const severityLevels: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

const dutyRoleIcon: Record<DutyRole, typeof Crown> = {
  PIC: Crown,
  SIC: UserCheck,
  Instructor: GraduationCap,
  Observer: Eye,
  Trainee: User,
}

const severityTone: Record<SeverityLevel, 'neutral' | 'amber' | 'red' | 'green'> = {
  Low: 'green',
  Medium: 'amber',
  High: 'amber',
  Critical: 'red',
}

const severityIcon: Record<SeverityLevel, typeof Info> = {
  Low: Info,
  Medium: AlertCircle,
  High: AlertTriangle,
  Critical: AlertOctagon,
}

const severityBorder: Record<SeverityLevel, string> = {
  Low: 'border-l-emerald-500',
  Medium: 'border-l-amber-500',
  High: 'border-l-amber-500',
  Critical: 'border-l-red-500',
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function FlightDetailPage() {
  const { id } = useParams<{ id: string }>()
  const flightId = id!
  const isCaptain = useAuthStore((state) => state.rank === 'Captain')

  const [tab, setTab] = useState<'crew' | 'crm'>('crew')
  const [flight, setFlight] = useState<FlightDto | null>(null)
  const [crew, setCrew] = useState<CrewDto[]>([])
  const [reports, setReports] = useState<CRMReportDto[]>([])
  const [pilots, setPilots] = useState<PilotDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      flightService.getAll(),
      crewService.getByFlight(flightId),
      crmReportService.getByFlight(flightId),
      isCaptain ? pilotService.getAll() : Promise.resolve([]),
    ])
      .then(([flights, crewList, reportList, pilotList]) => {
        setFlight(flights.find((f) => f.id === flightId) ?? null)
        setCrew(crewList)
        setReports(reportList)
        setPilots(pilotList)
      })
      .catch((err) => setError((err as ApiError).title ?? 'Uçuş bilgisi yüklenemedi.'))
      .finally(() => setIsLoading(false))
  }, [flightId, isCaptain])

  function refreshFlight() {
    flightService.getById(flightId).then(setFlight)
  }

  function refreshCrew() {
    crewService.getByFlight(flightId).then(setCrew)
  }

  function refreshReports() {
    crmReportService.getByFlight(flightId).then(setReports)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-40 rounded-3xl" />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !flight) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <p className="text-sm text-red-700">{error ?? 'Uçuş bulunamadı.'}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Boarding-pass header */}
      <section className="relative min-h-[280px] overflow-hidden rounded-3xl bg-navy-900 rise sm:min-h-[340px]">
        <img
          src="/images/clouds.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative flex h-full flex-col justify-center gap-6 p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Eyebrow tone="light" rule={false}>
              Flight Record
            </Eyebrow>
            {flight.isCancelled ? (
              <Badge tone="red" icon={Ban}>
                İptal Edildi
              </Badge>
            ) : (
              isCaptain && (
                <div className="flex items-center gap-2">
                  <Link
                    to={`/flights/${flightId}/edit`}
                    className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
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
            tone="dark"
            animated
          />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-200">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              <span className="data">{flight.date}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock3 className="h-4 w-4" />
              <span className="data">{flight.flightTime}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wrench className="h-4 w-4" />
              <span className="data">{flight.aircraftType}</span>
            </span>
          </div>
          {flight.metarInfo && (
            <div className="glass flex items-start gap-2 rounded-xl px-4 py-3">
              <Radio className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
              <div>
                <p className="eyebrow text-[10px] text-slate-300">METAR</p>
                <p className="data mt-1 text-xs leading-relaxed text-white">{flight.metarInfo}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tabs */}
      <div className="inline-flex w-fit gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm">
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
          isCaptain={isCaptain}
          onCreated={refreshCrew}
        />
      )}
      {tab === 'crm' && <CrmTab flightId={flightId} reports={reports} onCreated={refreshReports} />}
    </div>
  )
}

function CancelFlightControl({ flightId, onCancelled }: { flightId: string; onCancelled: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  async function handleConfirm() {
    setIsCancelling(true)
    try {
      await flightService.cancel(flightId)
      onCancelled()
    } finally {
      setIsCancelling(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-white">Emin misiniz?</span>
        <button
          onClick={handleConfirm}
          disabled={isCancelling}
          className="flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" />
          {isCancelling ? 'İptal ediliyor…' : 'Onayla'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isCancelling}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
        >
          Vazgeç
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/20"
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
        'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-navy-900 text-white' : 'text-slate-500 hover:text-navy-900',
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
  isCaptain,
  onCreated,
}: {
  flightId: string
  crew: CrewDto[]
  pilots: PilotDto[]
  isCaptain: boolean
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
          <Card className="py-10 text-center text-sm text-slate-500">Henüz mürettebat atanmadı.</Card>
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
                        ? 'bg-[#f59e0b]/15 text-[#b45309]'
                        : 'bg-[#00205b]/8 text-[#00205b]',
                    )}
                  >
                    {initials(member.pilotName)}
                  </span>
                  <span className="font-medium text-[#0b1220]">{member.pilotName}</span>
                </div>
                <Badge tone={member.dutyRole === 'PIC' ? 'amber' : 'neutral'} icon={RoleIcon}>
                  {member.dutyRole}
                </Badge>
              </Card>
            </Link>
          )
        })}
      </div>

      {isCaptain && (
        <Card className="h-fit lg:sticky lg:top-24">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-[#0b1220]">
            <UserPlus className="h-4 w-4 text-navy-900" />
            Mürettebat Ata
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {error && <p className="text-sm text-red-600">{error}</p>}
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
          <Card className="py-10 text-center text-sm text-slate-500">Henüz CRM raporu yok.</Card>
        )}
        {reports.map((report) => {
          const SeverityIcon = severityIcon[report.severityLevel]
          return (
            <Card key={report.id} className={cn('border-l-4', severityBorder[report.severityLevel])}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[#0b1220]">{report.title}</p>
                <Badge tone={severityTone[report.severityLevel]} icon={SeverityIcon}>
                  {report.severityLevel}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{report.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <span className="font-medium text-slate-500">
                  {report.isAnonymous ? 'Anonim' : (report.reporterName ?? 'Bilinmiyor')}
                </span>
                ·<span className="data">{new Date(report.createdDate).toLocaleString()}</span>
              </p>
            </Card>
          )
        })}
      </div>

      <Card className="h-fit lg:sticky lg:top-24">
        <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold text-[#0b1220]">
          <ShieldAlert className="h-4 w-4 text-navy-900" />
          Yeni CRM Raporu
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Başlık" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1.5">
            <label className="eyebrow text-[11px] text-slate-500">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-[#0b1220] outline-none transition-colors focus:border-[#00205b] focus:ring-4 focus:ring-[#00205b]/10"
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
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white accent-[#00205b]"
            />
            Anonim olarak gönder
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" icon={ShieldAlert} disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor…' : 'Raporu Gönder'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
