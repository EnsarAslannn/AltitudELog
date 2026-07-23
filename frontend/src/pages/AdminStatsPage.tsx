import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  Crown,
  GraduationCap,
  Info,
  PlaneTakeoff,
  Shield,
  ShieldAlert,
  ShieldCheck,
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
import type { StatsDto } from '../types/stats'
import type { PilotRank } from '../types/auth'
import type { SeverityLevel } from '../types/crmReport'
import type { ApiError } from '../types/problemDetails'

const CERT_WARNING_DAYS = 30

type CertStatus = 'expired' | 'expiringSoon' | 'valid' | 'unknown'

function certStatus(date: string | null): CertStatus {
  if (!date) return 'unknown'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((new Date(date).getTime() - today.getTime()) / 86_400_000)
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

const pilotRanks: PilotRank[] = ['Trainee', 'FirstOfficer', 'Captain', 'ChiefPilot']

const rankIcon: Record<PilotRank, typeof Shield> = {
  Trainee: GraduationCap,
  FirstOfficer: Shield,
  Captain: ShieldCheck,
  ChiefPilot: Crown,
}

const severityLevels: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical']

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

export function AdminStatsPage() {
  const [stats, setStats] = useState<StatsDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    statsService
      .getStats()
      .then(setStats)
      .catch((err) => setError((err as ApiError).title ?? 'İstatistikler yüklenemedi.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-24 rounded-2xl" />
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

  if (error || !stats) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <p className="text-sm text-red-700">{error ?? 'İstatistikler yüklenemedi.'}</p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="relative min-h-[180px] overflow-hidden rounded-3xl bg-navy-900 rise">
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
          <h1 className="font-display text-display-lg font-bold tracking-tight text-white">
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
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00205b]/6 text-[#00205b]">
                    <RankIcon className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-[#0b1220]">{rank}</span>
                </div>
                <span className="data text-sm font-semibold text-[#0b1220]">
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
          <Card className="py-8 text-center text-sm text-slate-500">
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
                    <p className="font-medium text-[#0b1220]">{cert.pilotName}</p>
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
                <span className="data text-sm font-semibold text-[#0b1220]">
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
