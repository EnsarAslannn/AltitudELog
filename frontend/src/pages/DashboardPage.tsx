import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Clock3, Plane, PlaneTakeoff, Radio, Wrench } from 'lucide-react'
import { flightService } from '../services/flightService'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
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
      <div className="flex flex-col gap-8">
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50/50">
        <p className="text-sm text-red-700">{error}</p>
      </Card>
    )
  }

  const now = new Date()
  const thisMonthCount = flights.filter((f) => {
    const [year, month] = f.date.split('-').map(Number)
    return year === now.getFullYear() && month === now.getMonth() + 1
  }).length
  const aircraftTypeCount = new Set(flights.map((f) => f.aircraftType)).size

  return (
    <div className="flex flex-col gap-10">
      {/* Hero band */}
      <section className="relative overflow-hidden rounded-3xl bg-[#00205b]">
        <img
          src="/images/runway.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#00205b] via-[#00205b]/85 to-[#00205b]/25" />
        <div className="relative flex flex-col gap-4 p-8 sm:p-10">
          <Eyebrow tone="light" rule={false}>
            Flight Log · Operasyon Özeti
          </Eyebrow>
          <h1 className="max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Kayıtlı tüm uçuşlar, tek bakışta.
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-slate-200">
            Rota, mürettebat ve CRM raporlarını inceleyin. Her uçuşun METAR bilgisi arka planda otomatik çekilir.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile icon={Plane} label="Toplam Uçuş" value={flights.length} />
        <StatTile icon={CalendarDays} label="Bu Ay" value={thisMonthCount} />
        <StatTile icon={Wrench} label="Uçak Tipi" value={aircraftTypeCount} />
      </div>

      {/* Flight strips */}
      <section className="flex flex-col gap-5">
        <Eyebrow>Uçuş Kayıtları</Eyebrow>

        {flights.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00205b]/5 text-[#00205b]">
              <PlaneTakeoff className="h-6 w-6" />
            </span>
            <p className="font-medium text-[#0b1220]">Henüz kayıtlı uçuş yok.</p>
            <p className="max-w-xs text-sm text-slate-500">
              İlk uçuşu ekleyince rota ve mürettebat kaydı burada listelenir.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {flights.map((flight) => (
              <Link key={flight.id} to={`/flights/${flight.id}`} className="group block">
                <Card interactive className="overflow-hidden p-0">
                  <div className="flex flex-col sm:flex-row">
                    {/* boarding-pass stub */}
                    <div className="flex items-center gap-3 border-b border-dashed border-slate-200 bg-[#f4f6fb] px-6 py-4 sm:w-40 sm:flex-col sm:items-start sm:justify-center sm:border-b-0 sm:border-r">
                      <span className="eyebrow text-[10px] text-slate-400">Aircraft</span>
                      <span className="data text-sm font-semibold text-[#0b1220]">
                        {flight.aircraftType}
                      </span>
                    </div>
                    {/* route + meta */}
                    <div className="flex flex-1 flex-col gap-4 px-6 py-5">
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
                        {flight.metarInfo && (
                          <span className="flex items-center gap-1.5 text-[#00205b]">
                            <Radio className="h-3.5 w-3.5" />
                            <span className="eyebrow text-[10px]">METAR</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
