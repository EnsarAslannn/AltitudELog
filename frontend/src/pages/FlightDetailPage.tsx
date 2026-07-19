import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  CalendarDays,
  Clock3,
  Crown,
  Eye,
  GraduationCap,
  Info,
  Radio,
  ShieldAlert,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react'
import { flightService } from '../services/flightService'
import { crewService } from '../services/crewService'
import { crmReportService } from '../services/crmReportService'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
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

  function refreshCrew() {
    crewService.getByFlight(flightId).then(setCrew)
  }

  function refreshReports() {
    crmReportService.getByFlight(flightId).then(setReports)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-24" />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !flight) {
    return <p className="text-sm text-red-600">{error ?? 'Uçuş bulunamadı.'}</p>
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-slate-900">{flight.originICAO}</span>
          <span className="h-px w-10 border-t border-dashed border-slate-400" />
          <span className="text-2xl font-bold text-slate-900">{flight.destinationICAO}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" />
            {flight.date}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock3 className="h-4 w-4" />
            {flight.flightTime}
          </span>
          <span className="flex items-center gap-1.5">
            <Wrench className="h-4 w-4" />
            {flight.aircraftType}
          </span>
        </div>
        {flight.metarInfo && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-sky-600">
            <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {flight.metarInfo}
          </p>
        )}
      </Card>

      <div className="inline-flex w-fit gap-1 rounded-full border border-slate-200 bg-white/60 p-1">
        <button
          onClick={() => setTab('crew')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            tab === 'crew' ? 'bg-blue-600 text-slate-50' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <Users className="h-4 w-4" />
          Mürettebat
        </button>
        <button
          onClick={() => setTab('crm')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            tab === 'crm' ? 'bg-blue-600 text-slate-50' : 'text-slate-500 hover:text-slate-900',
          )}
        >
          <ShieldAlert className="h-4 w-4" />
          CRM Raporları
        </button>
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {crew.length === 0 && <p className="text-slate-500">Henüz mürettebat atanmadı.</p>}
        {crew.map((member) => {
          const RoleIcon = dutyRoleIcon[member.dutyRole]
          return (
            <Card key={member.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-900">
                  {initials(member.pilotName)}
                </span>
                <span className="text-slate-900">{member.pilotName}</span>
              </div>
              <Badge tone="neutral" icon={RoleIcon}>
                {member.dutyRole}
              </Badge>
            </Card>
          )
        })}
      </div>

      {isCaptain && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <UserPlus className="h-4 w-4 text-blue-500" />
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {reports.length === 0 && <p className="text-slate-500">Henüz CRM raporu yok.</p>}
        {reports.map((report) => {
          const SeverityIcon = severityIcon[report.severityLevel]
          return (
            <Card key={report.id} className={cn('border-l-4', severityBorder[report.severityLevel])}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-slate-900">{report.title}</p>
                <Badge tone={severityTone[report.severityLevel]} icon={SeverityIcon}>
                  {report.severityLevel}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{report.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {report.isAnonymous ? 'Anonim' : (report.reporterName ?? 'Bilinmiyor')} ·{' '}
                {new Date(report.createdDate).toLocaleString()}
              </p>
            </Card>
          )
        })}
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ShieldAlert className="h-4 w-4 text-blue-500" />
          Yeni CRM Raporu
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Başlık" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="rounded-md border border-slate-300 bg-white/80 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-blue-600"
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
          <label className="flex items-center gap-2 text-sm text-slate-500">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 bg-white accent-blue-600"
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
