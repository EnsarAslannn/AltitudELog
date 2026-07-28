import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Save } from 'lucide-react'
import { flightService } from '../services/flightService'
import { FlightForm, type FlightFormValues } from '../components/flights/FlightForm'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Skeleton } from '../components/ui/Skeleton'
import type { FlightDto } from '../types/flight'
import type { ApiError } from '../types/problemDetails'

export function EditFlightPage() {
  const { id } = useParams<{ id: string }>()
  const flightId = id!
  const navigate = useNavigate()

  const [flight, setFlight] = useState<FlightDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    setError(null)

    flightService
      .getById(flightId)
      .then((data) => {
        if (!cancelled) setFlight(data)
      })
      .catch((err) => {
        if (cancelled) return
        const apiError = err as ApiError
        setError(apiError.status === 404 ? 'Uçuş bulunamadı.' : (apiError.title ?? 'Uçuş yüklenemedi.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [flightId])

  async function handleSubmit(values: FlightFormValues) {
    await flightService.update(flightId, {
      originICAO: values.originICAO,
      destinationICAO: values.destinationICAO,
      flightTime: values.flightTime,
      aircraftType: values.aircraftType,
      date: values.date,
    })
    navigate(`/flights/${flightId}`)
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6" aria-busy="true">
        <span className="sr-only">Yükleniyor…</span>
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-96 rounded-lg" />
      </div>
    )
  }

  if (error || !flight) {
    return (
      <Card className="mx-auto max-w-lg border-error/30 bg-error/5">
        <p role="alert" className="text-sm text-error">
          {error ?? 'Uçuş bulunamadı.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="relative min-h-[160px] overflow-hidden rounded-lg bg-surface rise">
        <img
          src="/images/wing-clouds.jpg"
          alt=""
          className="photo-mono absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="relative flex h-full flex-col justify-center gap-2 p-8 sm:p-10">
          <Eyebrow tone="soft" rule={false}>
            Captain · Flight Plan
          </Eyebrow>
          <h1 className="display text-3xl leading-[1.15] text-on-surface sm:text-4xl">
            Uçuşu Düzenle
          </h1>
          <p className="max-w-md text-sm text-on-surface-variant">
            Rota bilgisini güncelleyin. Kalkış havaalanı değişirse METAR yeniden çekilir.
          </p>
        </div>
      </section>

      <FlightForm
        initialValues={{
          originICAO: flight.originICAO,
          destinationICAO: flight.destinationICAO,
          flightTime: flight.flightTime,
          aircraftType: flight.aircraftType,
          date: flight.date,
        }}
        submitLabel="Değişiklikleri Kaydet"
        submittingLabel="Kaydediliyor…"
        submitIcon={Save}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
