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
import { hasCommandRank } from '../routes/ranks'
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
import {
  certStatus,
  certStatusIcon,
  certStatusLabelKey,
  certStatusTone,
  dutyRoleIcon,
  rankIcon,
} from '../lib/domainDisplay'
import { useT, type TranslationKey } from '../i18n'
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
  const [exportError, setExportError] = useState<string | null>(null)
  const t = useT()

  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  async function handleExport(format: 'csv' | 'pdf') {
    setExportingFormat(format)
    setExportError(null)
    try {
      const blob = await pilotService.exportLogbook(pilotId, format)
      downloadBlob(blob, `logbook-${pilotId}.${format}`)
    } catch (err) {
      if (isMountedRef.current) {
        const apiError = err as ApiError
        setExportError(apiError.title ?? t('profile.exportFailed'))
      }
    } finally {
      if (isMountedRef.current) setExportingFormat(null)
    }
  }

  const ownPilotId = useAuthStore((state) => state.pilotId)
  const ownRank = useAuthStore((state) => state.rank)
  const isOwnProfile = profile !== null && profile.id === ownPilotId
  const canExportLogbook = isOwnProfile || hasCommandRank(ownRank)

  const [licenseExpiryDraft, setLicenseExpiryDraft] = useState('')
  const [medicalExpiryDraft, setMedicalExpiryDraft] = useState('')
  const [isSavingCerts, setIsSavingCerts] = useState(false)
  const [certSaveError, setCertSaveError] = useState<string | null>(null)

  const fetchProfile = useCallback(
    (isCancelled: () => boolean, { showSkeleton = true } = {}) => {
      if (showSkeleton) setIsLoading(true)
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
          setError(apiError.status === 404 ? t('profile.notFound') : (apiError.title ?? t('profile.loadFailed')))
        })
        .finally(() => {
          if (!isCancelled() && showSkeleton) setIsLoading(false)
        })
    },
    [pilotId, t],
  )

  function refreshProfile() {
    fetchProfile(() => false, { showSkeleton: false })
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
      refreshProfile()
    } catch (err) {
      const apiError = err as ApiError
      setCertSaveError(apiError.title ?? t('profile.certSaveFailed'))
    } finally {
      setIsSavingCerts(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <span className="sr-only">{t('common.loading')}</span>
        <Skeleton className="h-40 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {error ?? t('profile.notFound')}
        </p>
      </Card>
    )
  }

  const RankIcon = rankIcon[profile.rank]

  return (
    <div className="flex flex-col gap-8">
      <section className="rise rounded-lg border border-white/30 bg-white/40 p-6 shadow-lg backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="data flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-twilight-blue/12 text-xl font-bold text-twilight-blue">
              {initials(profile.name)}
            </span>
            <div>
              <h1 className="display text-3xl text-on-surface sm:text-4xl">{profile.name}</h1>
              <p className="mt-1 text-sm text-on-surface-variant">@{profile.username}</p>
            </div>
          </div>
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
                {profile.isCurrent ? t('profile.current') : t('profile.notCurrent')}
              </Badge>
            </div>
            {canExportLogbook && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  icon={FileText}
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport('csv')}
                >
                  {exportingFormat === 'csv' ? t('profile.downloading') : t('profile.downloadCsv')}
                </Button>
                <Button
                  variant="secondary"
                  icon={FileDown}
                  disabled={exportingFormat !== null}
                  onClick={() => handleExport('pdf')}
                >
                  {exportingFormat === 'pdf' ? t('profile.downloading') : t('profile.downloadPdf')}
                </Button>
              </div>
            )}
            {exportError && (
              <p role="alert" className="text-sm text-error">
                {exportError}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={PlaneTakeoff} label={t('profile.stat.totalFlights')} value={profile.totalFlights} />
        <StatTile icon={Clock3} label={t('profile.stat.totalHours')} value={profile.totalFlightHours} />
        <StatTile icon={Wrench} label={t('profile.stat.aircraftVariety')} value={profile.hoursByAircraftType.length} />
        <StatTile icon={CalendarDays} label={t('profile.stat.last90Days')} value={profile.hoursLast90Days} />
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>{t('profile.hoursByType')}</Eyebrow>
        {profile.hoursByAircraftType.length === 0 ? (
          <Card className="py-8 text-center text-sm text-on-surface-variant">{t('profile.noFlights')}</Card>
        ) : (
          <div className="flex flex-col gap-3">
            {profile.hoursByAircraftType.map((entry) => (
              <Card key={entry.aircraftType} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-twilight-blue/12 text-twilight-blue">
                    <AircraftSilhouette code={entry.aircraftType} className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">{entry.aircraftType}</p>
                    <p className="text-xs text-on-surface-variant">
                      {[aircraftLabel(entry.aircraftType), t('profile.flightCount', { count: entry.flightCount })]
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

      <section className="flex flex-col gap-4">
        <Eyebrow>{t('profile.certificates')}</Eyebrow>
        <div className="flex flex-col gap-3">
          {(
            [
              {
                key: 'license' as const,
                labelKey: 'profile.license' as TranslationKey,
                icon: BadgeCheck,
                date: profile.licenseExpiryDate,
              },
              {
                key: 'medical' as const,
                labelKey: 'profile.medical' as TranslationKey,
                icon: Stethoscope,
                date: profile.medicalExpiryDate,
              },
            ]
          ).map((cert) => {
            const status = certStatus(cert.date)
            const StatusIcon = certStatusIcon[status]
            return (
              <Card key={cert.key} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-twilight-blue/12 text-twilight-blue">
                    <cert.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-medium text-on-surface">{t(cert.labelKey)}</p>
                    <p className="data text-xs text-on-surface-variant">{cert.date ?? t('profile.noDate')}</p>
                  </div>
                </div>
                <Badge tone={certStatusTone[status]} icon={StatusIcon}>
                  {t(certStatusLabelKey[status])}
                </Badge>
              </Card>
            )
          })}
        </div>

        {isOwnProfile && (
          <Card className="flex flex-col gap-4">
            <p className="text-xs font-medium text-on-surface-variant">{t('profile.updateCerts')}</p>
            <form
              onSubmit={handleSaveCertificates}
              aria-busy={isSavingCerts}
              className="flex flex-col gap-4 sm:flex-row sm:items-end"
            >
              <Input
                label={t('profile.licenseExpiry')}
                name="licenseExpiryDate"
                type="date"
                value={licenseExpiryDraft}
                onChange={(e) => setLicenseExpiryDraft(e.target.value)}
              />
              <Input
                label={t('profile.medicalExpiry')}
                name="medicalExpiryDate"
                type="date"
                value={medicalExpiryDraft}
                onChange={(e) => setMedicalExpiryDraft(e.target.value)}
              />
              <Button type="submit" variant="secondary" disabled={isSavingCerts}>
                {isSavingCerts ? t('common.saving') : t('common.save')}
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

      <section className="flex flex-col gap-4">
        <Eyebrow>{t('profile.recentFlights')}</Eyebrow>
        {profile.recentFlights.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-twilight-blue/12 text-twilight-blue">
              <PlaneTakeoff className="h-6 w-6" />
            </span>
            <p className="font-medium text-on-surface">{t('profile.emptyFlights')}</p>
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
