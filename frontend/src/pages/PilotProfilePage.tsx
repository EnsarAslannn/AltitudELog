import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  FileDown,
  FileText,
  PlaneTakeoff,
  ShieldCheck,
  ShieldX,
  Stethoscope,
  Wrench,
} from 'lucide-react'
import { pilotService } from '../services/pilotService'
import { useAuthStore } from '../store/authStore'
import { AircraftSilhouette } from '../components/ui/AircraftSilhouette'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { aircraftLabel } from '../data/aircraftTypes'
import { downloadBlob } from '../lib/download'
import { certStatus, certStatusIcon, certStatusLabel, certStatusTone, dutyRoleIcon, rankIcon } from '../lib/domainDisplay'
import type { PilotProfileDto } from '../types/pilot'
import type { ApiError } from '../types/problemDetails'

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

  const isMountedRef = useRef(true)
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleExport(format: 'csv' | 'pdf') {
    setExportingFormat(format)
    try {
      const blob = await pilotService.exportLogbook(pilotId, format)
      downloadBlob(blob, `logbook-${pilotId}.${format}`)
    } finally {
      if (isMountedRef.current) setExportingFormat(null)
    }
  }

  const ownPilotId = useAuthStore((state) => state.pilotId)
  const isOwnProfile = profile !== null && profile.id === ownPilotId

  const [licenseExpiryDraft, setLicenseExpiryDraft] = useState('')
  const [medicalExpiryDraft, setMedicalExpiryDraft] = useState('')
  const [isSavingCerts, setIsSavingCerts] = useState(false)
  const [certSaveError, setCertSaveError] = useState<string | null>(null)

  const fetchProfile = useCallback(
    (isCancelled: () => boolean) => {
      setIsLoading(true)
      setError(null)
      return pilotService
        .getProfile(pilotId)
        .then((data) => {
          if (isCancelled()) return
          setProfile(data)
          setLicenseExpiryDraft(data.licenseExpiryDate ?? '')
          setMedicalExpiryDraft(data.medicalExpiryDate ?? '')
        })
        .catch((err) => {
          if (isCancelled()) return
          const apiError = err as ApiError
          setError(apiError.status === 404 ? 'Pilot bulunamadı.' : (apiError.title ?? 'Pilot bilgisi yüklenemedi.'))
        })
        .finally(() => {
          if (!isCancelled()) setIsLoading(false)
        })
    },
    [pilotId],
  )

  function loadProfile() {
    fetchProfile(() => false)
  }

  useEffect(() => {
    let cancelled = false
    fetchProfile(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [fetchProfile])

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
      <div className="flex flex-col gap-8" aria-busy="true">
        <span className="sr-only">Yükleniyor…</span>
        <Skeleton className="h-40 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <Card className="border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? 'Pilot bulunamadı.'}
        </p>
      </Card>
    )
  }

  const RankIcon = rankIcon[profile.rank]

  return (
    <div className="flex flex-col gap-8">
      {/* Profile header — photo-backed band, same hero recipe as the dashboard */}
      <section className="relative min-h-[220px] overflow-hidden rounded-lg bg-surface rise">
        <img
          src="/images/terminal.jpg"
          alt=""
          className="photo-rich absolute inset-0 h-full w-full object-cover object-[center_72%]"
          loading="eager"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <span className="data flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-xl font-bold text-on-surface">
              {initials(profile.name)}
            </span>
            <div>
              <h1 className="display text-3xl text-on-surface sm:text-4xl">{profile.name}</h1>
              <p className="mt-1 text-sm text-on-surface-variant">@{profile.username}</p>
            </div>
          </div>
          {/* Status and actions are grouped separately so they stack as two clean rows on
              a phone instead of wrapping into each other mid-flow. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                tone={profile.rank === 'Captain' || profile.rank === 'ChiefPilot' ? 'solid' : 'neutral'}
                icon={RankIcon}
              >
                {profile.rank}
              </Badge>
              <Badge tone="sky" icon={BadgeCheck}>
                {profile.licenseNumber}
              </Badge>
              <Badge tone={profile.isCurrent ? 'green' : 'red'} icon={profile.isCurrent ? ShieldCheck : ShieldX}>
                {profile.isCurrent ? 'Current' : 'Not Current'}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
          </div>
        </div>
      </section>

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
          <Card className="py-8 text-center text-sm text-on-surface-variant">Henüz uçuş kaydı yok.</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.hoursByAircraftType.map((entry) => (
              <Card key={entry.aircraftType} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface">
                    <AircraftSilhouette code={entry.aircraftType} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">{entry.aircraftType}</p>
                    <p className="text-xs text-on-surface-variant">
                      {[aircraftLabel(entry.aircraftType), `${entry.flightCount} uçuş`]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                <span className="data text-sm font-semibold text-on-surface">{entry.totalHours}</span>
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high text-on-surface">
                    <cert.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">{cert.label}</p>
                    <p className="data text-xs text-on-surface-variant">{cert.date ?? 'Tarih belirtilmemiş'}</p>
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
            <p className="text-xs font-medium text-on-surface-variant">Sertifika tarihlerini güncelle</p>
            <form
              onSubmit={handleSaveCertificates}
              aria-busy={isSavingCerts}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
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
            {certSaveError && (
              <p role="alert" className="text-sm text-error">
                {certSaveError}
              </p>
            )}
          </Card>
        )}
      </section>

      {/* Recent flights */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Son Uçuşlar</Eyebrow>
        {profile.recentFlights.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
              <PlaneTakeoff className="h-6 w-6" />
            </span>
            <p className="font-medium text-on-surface">Henüz kayıtlı uçuş yok.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {profile.recentFlights.map((flight) => {
              const RoleIcon = dutyRoleIcon[flight.dutyRole]
              return (
                <Link key={flight.flightId} to={`/flights/${flight.flightId}`} className="group block">
                  <Card interactive className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <RouteRibbon origin={flight.originICAO} destination={flight.destinationICAO} size="md" />
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <span className="data">{flight.date}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span className="data">{flight.flightTime}</span>
                      </span>
                      <Badge tone={flight.dutyRole === 'PIC' ? 'solid' : 'neutral'} icon={RoleIcon}>
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
