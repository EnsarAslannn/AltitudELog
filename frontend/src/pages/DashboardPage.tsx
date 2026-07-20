import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Plane, PlaneTakeoff, Radio, Wrench } from 'lucide-react'
import { flightService } from '../services/flightService'
import { Card } from '../components/ui/Card'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import type { FlightDto } from '../types/flight'
import type { ApiError } from '../types/problemDetails'

export function DashboardPage() {
  const [flights, setFlights] = useState<FlightDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    flightService
      .getAll()
      .then(setFlights)
      .catch((err) => setError((err as ApiError).title ?? 'Uçuşlar yüklenemedi.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  const now = new Date()
  const thisMonthCount = flights.filter((f) => {
    const [year, month] = f.date.split('-').map(Number)
    return year === now.getFullYear() && month === now.getMonth() + 1
  }).length
  const aircraftTypeCount = new Set(flights.map((f) => f.aircraftType)).size

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Uçuşlar</h1>
        <p className="text-sm text-slate-500">Kayıtlı tüm uçuş loglarının özeti.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile icon={Plane} label="Toplam Uçuş" value={flights.length} />
        <StatTile icon={CalendarDays} label="Bu Ay" value={thisMonthCount} />
        <StatTile icon={Wrench} label="Uçak Tipi" value={aircraftTypeCount} />
      </div>

      {flights.length === 0 && (
        <Card className="flex flex-col items-center gap-2 py-12 text-center">
          <PlaneTakeoff className="h-8 w-8 text-slate-400" />
          <p className="text-slate-500">Henüz kayıtlı uçuş yok.</p>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {flights.map((flight) => (
          <Link key={flight.id} to={`/flights/${flight.id}`}>
            <Card interactive className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-slate-900">{flight.originICAO}</span>
                <div className="flex items-center gap-1 text-blue-500">
                  <span className="h-px w-8 border-t border-dashed border-slate-400" />
                  <Plane className="h-4 w-4 rotate-90" />
                  <span className="h-px w-8 border-t border-dashed border-slate-400" />
                </div>
                <span className="text-lg font-bold text-slate-900">{flight.destinationICAO}</span>
              </div>
              <div className="hidden items-center gap-4 text-sm text-slate-500 sm:flex">
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
                {flight.metarInfo && (
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <Radio className="h-4 w-4" />
                  </span>
                )}
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Plane
  label: string
  value: number
}) {
  return (
    <Card className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-900/5 text-slate-700">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-3xl font-bold leading-none tabular-nums text-slate-900">{value}</p>
        <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      </div>
    </Card>
  )
}
