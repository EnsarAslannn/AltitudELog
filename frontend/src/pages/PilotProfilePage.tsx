import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  CalendarDays,
  Clock3,
  Crown,
  Eye,
  GraduationCap,
  PlaneTakeoff,
  Shield,
  ShieldCheck,
  User,
  UserCheck,
  Wrench,
} from 'lucide-react'
import { pilotService } from '../services/pilotService'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import type { PilotProfileDto } from '../types/pilot'
import type { PilotRank } from '../types/auth'
import type { DutyRole } from '../types/crew'
import type { ApiError } from '../types/problemDetails'

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

  useEffect(() => {
    pilotService
      .getProfile(pilotId)
      .then(setProfile)
      .catch((err) => {
        const apiError = err as ApiError
        setError(apiError.status === 404 ? 'Pilot bulunamadı.' : (apiError.title ?? 'Pilot bilgisi yüklenemedi.'))
      })
      .finally(() => setIsLoading(false))
  }, [pilotId])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <Skeleton className="h-40 rounded-3xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
      <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-4">
          <span className="data flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#00205b]/8 text-lg font-bold text-[#00205b]">
            {initials(profile.name)}
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0b1220]">{profile.name}</h1>
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
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={PlaneTakeoff} label="Toplam Uçuş" value={profile.totalFlights} />
        <StatTile icon={Clock3} label="Toplam Saat" value={profile.totalFlightHours} />
        <StatTile icon={Wrench} label="Uçak Tipi Çeşidi" value={profile.hoursByAircraftType.length} />
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
