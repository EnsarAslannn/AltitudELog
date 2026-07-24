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
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    )
  }

  if (error || !flight) {
    return (
      <Card className="mx-auto max-w-lg border-red-200 bg-red-50/50">
        <p role="alert" className="text-sm text-red-700">
          {error ?? 'Uçuş bulunamadı.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-lg">
        <Eyebrow className="mb-3">Captain · Flight Plan</Eyebrow>
        <h1 className="font-display text-display-lg font-bold tracking-tight text-[#0b1220]">Uçuşu Düzenle</h1>
        <p className="mt-1 text-sm text-slate-500">
          Rota bilgisini güncelleyin. Kalkış havaalanı değişirse METAR yeniden çekilir.
        </p>
      </div>

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
