import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Crown,
  Eye,
  FileDown,
  FileText,
  GraduationCap,
  HelpCircle,
  PlaneTakeoff,
  Shield,
  ShieldCheck,
  ShieldX,
  Stethoscope,
  User,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { downloadBlob } from '../lib/download'
import type { PilotProfileDto } from '../types/pilot'
import type { PilotRank } from '../types/auth'
import type { DutyRole } from '../types/crew'
import type { ApiError } from '../types/problemDetails'

const CERT_WARNING_DAYS = 30

type CertStatus = 'unknown' | 'valid' | 'expiringSoon' | 'expired'

function certStatus(date: string | null): CertStatus {
  if (!date) return 'unknown'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(date)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / 86_400_000)
  if (diffDays < 0) return 'expired'
  if (diffDays <= CERT_WARNING_DAYS) return 'expiringSoon'
  return 'valid'
}

const certStatusTone: Record<CertStatus, 'neutral' | 'green' | 'amber' | 'red'> = {
  unknown: 'neutral',
  valid: 'green',
  expiringSoon: 'amber',
  expired: 'red',
}

const certStatusIcon: Record<CertStatus, typeof CheckCircle2> = {
  unknown: HelpCircle,
  valid: CheckCircle2,
  expiringSoon: AlertTriangle,
  expired: AlertOctagon,
}

const certStatusLabel: Record<CertStatus, string> = {
  unknown: 'Belirtilmemiş',
  valid: 'Geçerli',
  expiringSoon: 'Yakında Doluyor',
  expired: 'Süresi Doldu',
}

const rankIcon: Record<PilotRank, typeof Shield> = {
  Trainee: GraduationCap,
  FirstOfficer: Shield,
  Captain: ShieldCheck,
  ChiefPilot: Crown,
}

const dutyRoleIcon: Record<DutyRole, typeof Crown> = {
  PIC: Crown,
  SIC: UserCheck,
  Instructor: GraduationCap,
  Observer: Eye,
  Trainee: User,
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function PilotProfilePage() {
  const { id } = useParams<{ id: string }>()
  const pilotId = id!

  const [profile, setProfile] = useState<PilotProfileDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportingFormat, setExportingFormat] = useState<'csv' | 'pdf' | null>(null)

  async function handleExport(format: 'csv' | 'pdf') {
    setExportingFormat(format)
    try {
      const blob = await pilotService.exportLogbook(pilotId, format)
      downloadBlob(blob, `logbook-${pilotId}.${format}`)
    } finally {
      setExportingFormat(null)
    }
  }

  const ownPilotId = useAuthStore((state) => state.pilotId)
  const isOwnProfile = profile !== null && profile.id === ownPilotId

  const [licenseExpiryDraft, setLicenseExpiryDraft] = useState('')
  const [medicalExpiryDraft, setMedicalExpiryDraft] = useState('')
  const [isSavingCerts, setIsSavingCerts] = useState(false)
  const [certSaveError, setCertSaveError] = useState<string | null>(null)

  function loadProfile() {
    setIsLoading(true)
    pilotService
      .getProfile(pilotId)
      .then((data) => {
        setProfile(data)
        setLicenseExpiryDraft(data.licenseExpiryDate ?? '')
        setMedicalExpiryDraft(data.medicalExpiryDate ?? '')
      })
      .catch((err) => {
        const apiError = err as ApiError
        setError(apiError.status === 404 ? 'Pilot bulunamadı.' : (apiError.title ?? 'Pilot bilgisi yüklenemedi.'))
      })
      .finally(() => setIsLoading(false))
  }

  useEffect(loadProfile, [pilotId])

  async function handleSaveCertificates(event: FormEvent) {
    event.preventDefault()
    setIsSavingCerts(true)
    setCertSaveError(null)
    try {
      await pilotService.updateCertificates(licenseExpiryDraft || null, medicalExpiryDraft || null)
      loadProfile()
    } catch (err) {
      const apiError = err as ApiError
      setCertSaveError(apiError.title ?? 'Sertifika bilgileri kaydedilemedi.')
    } finally {
      setIsSavingCerts(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <p className="text-sm text-red-700">{error ?? 'Pilot bulunamadı.'}</p>
      </Card>
    )
  }

  const RankIcon = rankIcon[profile.rank]

  return (
    <div className="flex flex-col gap-8">
      {/* Profile header */}
      <Card className="flex flex-col gap-5 p-6 rise sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="data flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-navy-900/8 text-xl font-bold text-navy-900">
            {initials(profile.name)}
          </span>
          <div>
            <h1 className="font-display text-display-lg font-bold tracking-tight text-[#0b1220]">{profile.name}</h1>
            <p className="data mt-1 text-sm text-slate-500">@{profile.username}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={profile.rank === 'Captain' || profile.rank === 'ChiefPilot' ? 'amber' : 'neutral'} icon={RankIcon}>
            {profile.rank}
          </Badge>
          <Badge tone="sky" icon={BadgeCheck}>
            {profile.licenseNumber}
          </Badge>
          <Badge tone={profile.isCurrent ? 'green' : 'red'} icon={profile.isCurrent ? ShieldCheck : ShieldX}>
            {profile.isCurrent ? 'Current' : 'Not Current'}
          </Badge>
          <Button
            variant="secondary"
            icon={FileText}
            disabled={exportingFormat !== null}
            onClick={() => handleExport('csv')}
          >
            {exportingFormat === 'csv' ? 'İndiriliyor…' : 'CSV İndir'}
          </Button>
          <Button
            variant="secondary"
            icon={FileDown}
            disabled={exportingFormat !== null}
            onClick={() => handleExport('pdf')}
          >
            {exportingFormat === 'pdf' ? 'İndiriliyor…' : 'PDF İndir'}
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile icon={PlaneTakeoff} label="Toplam Uçuş" value={profile.totalFlights} />
        <StatTile icon={Clock3} label="Toplam Saat" value={profile.totalFlightHours} />
        <StatTile icon={Wrench} label="Uçak Tipi Çeşidi" value={profile.hoursByAircraftType.length} />
        <StatTile icon={CalendarDays} label="Son 90 Gün" value={profile.hoursLast90Days} />
      </div>

      {/* Hours by aircraft type */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Uçak Tipine Göre Saatler</Eyebrow>
        {profile.hoursByAircraftType.length === 0 ? (
          <Card className="py-8 text-center text-sm text-slate-500">Henüz uçuş kaydı yok.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.hoursByAircraftType.map((entry) => (
              <Card key={entry.aircraftType} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00205b]/6 text-[#00205b]">
                    <Wrench className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-[#0b1220]">{entry.aircraftType}</p>
                    <p className="text-xs text-slate-500">{entry.flightCount} uçuş</p>
                  </div>
                </div>
                <span className="data text-sm font-semibold text-[#0b1220]">{entry.totalHours}</span>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Certificates */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Sertifikalar</Eyebrow>
        <div className="flex flex-col gap-3">
          {(
            [
              { key: 'license' as const, label: 'Lisans', icon: BadgeCheck, date: profile.licenseExpiryDate },
              { key: 'medical' as const, label: 'Medical', icon: Stethoscope, date: profile.medicalExpiryDate },
            ]
          ).map((cert) => {
            const status = certStatus(cert.date)
            const StatusIcon = certStatusIcon[status]
            return (
              <Card key={cert.key} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00205b]/6 text-[#00205b]">
                    <cert.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-[#0b1220]">{cert.label}</p>
                    <p className="data text-xs text-slate-500">{cert.date ?? 'Tarih belirtilmemiş'}</p>
                  </div>
                </div>
                <Badge tone={certStatusTone[status]} icon={StatusIcon}>
                  {certStatusLabel[status]}
                </Badge>
              </Card>
            )
          })}
        </div>

        {isOwnProfile && (
          <Card className="flex flex-col gap-4">
            <p className="text-xs font-medium text-slate-500">Sertifika tarihlerini güncelle</p>
            <form onSubmit={handleSaveCertificates} className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <Input
                label="Lisans Bitiş Tarihi"
                name="licenseExpiryDate"
                type="date"
                value={licenseExpiryDraft}
                onChange={(e) => setLicenseExpiryDraft(e.target.value)}
              />
              <Input
                label="Medical Bitiş Tarihi"
                name="medicalExpiryDate"
                type="date"
                value={medicalExpiryDraft}
                onChange={(e) => setMedicalExpiryDraft(e.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={isSavingCerts}>
                {isSavingCerts ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </form>
            {certSaveError && <p className="text-sm text-red-600">{certSaveError}</p>}
          </Card>
        )}
      </section>

      {/* Recent flights */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Son Uçuşlar</Eyebrow>
        {profile.recentFlights.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00205b]/5 text-[#00205b]">
              <PlaneTakeoff className="h-6 w-6" />
            </span>
            <p className="font-medium text-[#0b1220]">Henüz kayıtlı uçuş yok.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {profile.recentFlights.map((flight) => {
              const RoleIcon = dutyRoleIcon[flight.dutyRole]
              return (
                <Link key={flight.flightId} to={`/flights/${flight.flightId}`} className="group block">
                  <Card interactive className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <RouteRibbon origin={flight.originICAO} destination={flight.destinationICAO} size="md" />
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="data">{flight.date}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span className="data">{flight.flightTime}</span>
                      </span>
                      <Badge tone={flight.dutyRole === 'PIC' ? 'amber' : 'neutral'} icon={RoleIcon}>
                        {flight.dutyRole}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
