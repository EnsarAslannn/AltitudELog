import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  PlaneTakeoff,
  ShieldAlert,
  Stethoscope,
  Users,
} from 'lucide-react'
import { statsService } from '../services/statsService'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { CrmTrendChart } from '../components/ui/CrmTrendChart'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { certStatus, certStatusTone, rankIcon, severityIcon, severityTone } from '../lib/domainDisplay'
import type { StatsDto } from '../types/stats'
import type { PilotRank } from '../types/auth'
import type { SeverityLevel } from '../types/crmReport'
import type { ApiError } from '../types/problemDetails'

const pilotRanks: PilotRank[] = ['Trainee', 'FirstOfficer', 'Captain', 'ChiefPilot']

const severityLevels: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

export function AdminStatsPage() {
  const [stats, setStats] = useState<StatsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    statsService
      .getStats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as ApiError).title ?? 'İstatistikler yüklenemedi.')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <span className="sr-only">Yükleniyor…</span>
        <Skeleton className="h-24 rounded-lg" />
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

  if (error || !stats) {
    return (
      <Card className="border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? 'İstatistikler yüklenemedi.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="relative min-h-[180px] overflow-hidden rounded-lg bg-surface rise">
        <img
          src="/images/flightdeck.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative flex h-full flex-col justify-center gap-2 p-8 sm:p-10">
          <Eyebrow tone="light" rule={false}>
            Yönetim Paneli
          </Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-on-primary">
            Operasyon İstatistikleri
          </h1>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatTile icon={PlaneTakeoff} label="Toplam Uçuş" value={stats.totalFlights} />
        <StatTile icon={CalendarDays} label="Bu Ay" value={stats.flightsThisMonth} />
        <StatTile icon={Users} label="Toplam Pilot" value={stats.totalPilots} />
        <StatTile icon={ShieldAlert} label="Toplam CRM Raporu" value={stats.totalCrmReports} />
      </div>

      {/* Pilots by rank */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Rütbeye Göre Pilotlar</Eyebrow>
        <div className="flex flex-col gap-3">
          {pilotRanks.map((rank) => {
            const RankIcon = rankIcon[rank]
            return (
              <Card key={rank} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/40 text-primary">
                    <RankIcon className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-on-surface">{rank}</span>
                </div>
                <span className="data text-sm font-semibold text-on-surface">
                  {stats.pilotsByRank[rank] ?? 0}
                </span>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CRM trend */}
      <section className="flex flex-col gap-4">
        <Eyebrow>CRM Trend (Son 6 Ay)</Eyebrow>
        <Card className="p-5">
          <CrmTrendChart data={stats.crmTrendByMonth} />
        </Card>
      </section>

      {/* Expiring certifications */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Yaklaşan Sertifika Süreleri</Eyebrow>
        {stats.expiringCertifications.length === 0 ? (
          <Card className="py-8 text-center text-sm text-on-surface-variant">
            Yaklaşan veya süresi dolmuş sertifika yok.
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {stats.expiringCertifications.map((cert) => {
              const licenseStatus = certStatus(cert.licenseExpiryDate)
              const medicalStatus = certStatus(cert.medicalExpiryDate)
              return (
                <Link key={cert.pilotId} to={`/pilots/${cert.pilotId}`} className="group block">
                  <Card interactive className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-on-surface">{cert.pilotName}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      {cert.licenseExpiryDate && (
                        <Badge tone={certStatusTone[licenseStatus]} icon={BadgeCheck}>
                          {cert.licenseExpiryDate}
                        </Badge>
                      )}
                      {cert.medicalExpiryDate && (
                        <Badge tone={certStatusTone[medicalStatus]} icon={Stethoscope}>
                          {cert.medicalExpiryDate}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* CRM reports by severity */}
      <section className="flex flex-col gap-4">
        <Eyebrow>Ciddiyete Göre CRM Raporları</Eyebrow>
        <div className="flex flex-col gap-3">
          {severityLevels.map((level) => {
            const SeverityIcon = severityIcon[level]
            return (
              <Card key={level} className="flex items-center justify-between py-4">
                <Badge tone={severityTone[level]} icon={SeverityIcon}>
                  {level}
                </Badge>
                <span className="data text-sm font-semibold text-on-surface">
                  {stats.crmReportsBySeverity[level] ?? 0}
                </span>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
