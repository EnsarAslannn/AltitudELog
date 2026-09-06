import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CalendarDays, Clock3, Plane, PlaneTakeoff, Radio, Wrench, X } from 'lucide-react'
import { flightService } from '../services/flightService'
import { FlightFilterBar } from '../components/flights/FlightFilterBar'
import { useFlightQuery } from '../hooks/useFlightQuery'
import { AircraftSilhouette } from '../components/ui/AircraftSilhouette'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Pagination } from '../components/ui/Pagination'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import { Skeleton, SkeletonCard } from '../components/ui/Skeleton'
import { StatTile } from '../components/ui/StatTile'
import { cn } from '../lib/cn'
import { useT } from '../i18n'
import type { FlightsPageResult } from '../types/flight'
import type { ApiError } from '../types/problemDetails'

export function DashboardPage() {
  const { query, updateQuery, clearFilters, activeFilterCount } = useFlightQuery()
  const t = useT()
  const page = query.pageNumber ?? 1

  const [pageResult, setPageResult] = useState<FlightsPageResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedOnceRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (hasLoadedOnceRef.current) {
      setIsPageLoading(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    flightService
      .getAll(query)
      .then((data) => {
        if (cancelled) return

        const lastPage = Math.max(1, Math.ceil(data.totalCount / data.pageSize))
        if (page > lastPage) {
          updateQuery({ pageNumber: lastPage })
          return
        }

        setPageResult(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as ApiError).title ?? t('dashboard.loadFailed'))
      })
      .finally(() => {
        if (!cancelled) {
          hasLoadedOnceRef.current = true
          setIsLoading(false)
          setIsPageLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [query, page, updateQuery, t])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <span className="sr-only">{t('common.loading')}</span>
        <Skeleton className="h-56 rounded-lg" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error || !pageResult) {
    return (
      <Card className="border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? t('dashboard.loadFailed')}
        </p>
      </Card>
    )
  }

  const {
    items: flights,
    totalCount,
    activeCount,
    thisMonthCount,
    distinctAircraftTypeCount,
    pageSize,
  } = pageResult
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  return (
    <div className="flex flex-col gap-10">
      <section className="rise">
        <div className="flex flex-col justify-center gap-4">
          <Eyebrow tone="soft" rule={false}>
            {t('dashboard.eyebrow')}
          </Eyebrow>
          <h1 className="on-photo max-w-xl display text-4xl leading-[1.1] text-on-surface sm:text-5xl">
            {t('dashboard.title')}
          </h1>
          <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
            {t('dashboard.subtitle')}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 rise sm:grid-cols-3" style={{ '--rise-delay': '80ms' } as React.CSSProperties}>
        <StatTile icon={Plane} label={t('dashboard.stat.totalFlights')} value={activeCount} />
        <StatTile icon={CalendarDays} label={t('dashboard.stat.thisMonth')} value={thisMonthCount} />
        <StatTile icon={Wrench} label={t('dashboard.stat.aircraftType')} value={distinctAircraftTypeCount} />
      </div>

      <section className="flex flex-col gap-5" aria-busy={isPageLoading}>
        <Eyebrow>{t('dashboard.sectionTitle')}</Eyebrow>

        <FlightFilterBar
          query={query}
          onChange={updateQuery}
          onClear={clearFilters}
          activeFilterCount={activeFilterCount}
          resultCount={totalCount}
          isLoading={isPageLoading}
        />

        {flights.length === 0 ? (
          <Card className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-twilight-blue/12 text-twilight-blue">
              <PlaneTakeoff className="h-6 w-6" />
            </span>
            {activeFilterCount > 0 ? (
              <>
                <p className="font-medium text-on-surface">{t('dashboard.emptyFiltered.title')}</p>
                <p className="max-w-xs text-sm text-on-surface-variant">
                  {t('dashboard.emptyFiltered.body')}
                </p>
                <Button variant="secondary" icon={X} onClick={clearFilters}>
                  {t('dashboard.emptyFiltered.action')}
                </Button>
              </>
            ) : (
              <>
                <p className="font-medium text-on-surface">{t('dashboard.empty.title')}</p>
                <p className="max-w-xs text-sm text-on-surface-variant">
                  {t('dashboard.empty.body')}
                </p>
              </>
            )}
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {flights.map((flight, index) => (
              <Link
                key={flight.id}
                to={`/flights/${flight.id}`}
                className="group block rise"
                style={{ '--rise-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <Card interactive className={cn('overflow-hidden p-0', flight.isCancelled && 'opacity-60')}>
                  <div className="flex flex-col sm:flex-row">
                    <div className="flex items-center gap-3 border-b border-dashed border-outline-variant/50 bg-surface-container-low px-6 py-4 sm:w-40 sm:flex-col sm:items-start sm:justify-center sm:border-b-0 sm:border-r">
                      <span className="eyebrow text-[10px] text-outline">{t('dashboard.aircraft')}</span>
                      <span className="flex items-center gap-2">
                        <AircraftSilhouette
                          code={flight.aircraftType}
                          className="h-4 w-4 text-outline"
                        />
                        <span className="data text-sm font-semibold text-on-surface">
                          {flight.aircraftType}
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-4 px-6 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <RouteRibbon origin={flight.originICAO} destination={flight.destinationICAO} size="md" />
                        {flight.isCancelled && (
                          <Badge tone="red" icon={Ban}>
                            {t('flight.cancelled')}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-on-surface-variant">
                        <span className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5" />
                          <span className="data">{flight.date}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock3 className="h-3.5 w-3.5" />
                          <span className="data">{flight.flightTime}</span>
                        </span>
                        {flight.metarInfo && (
                          <span className="flex items-center gap-1.5 text-primary">
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

        <Pagination
          pageNumber={page}
          totalPages={totalPages}
          onPageChange={(pageNumber) => updateQuery({ pageNumber })}
          disabled={isPageLoading}
        />
      </section>
    </div>
  )
}
