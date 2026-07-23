import { useState, type FormEvent } from 'react'
import { CalendarDays, Clock3, PlaneTakeoff, Radio, Wrench } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { RouteRibbon } from '../ui/RouteRibbon'
import type { ApiError } from '../../types/problemDetails'

export interface FlightFormValues {
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
  metarInfo?: string | null
}

interface FlightFormProps {
  initialValues?: Partial<FlightFormValues>
  includeMetar?: boolean
  submitLabel: string
  submittingLabel: string
  submitIcon?: typeof PlaneTakeoff
  onSubmit: (values: FlightFormValues) => Promise<void>
}

export function FlightForm({
  initialValues,
  includeMetar = false,
  submitLabel,
  submittingLabel,
  submitIcon: SubmitIcon = PlaneTakeoff,
  onSubmit,
}: FlightFormProps) {
  const [originICAO, setOriginICAO] = useState(initialValues?.originICAO ?? '')
  const [destinationICAO, setDestinationICAO] = useState(initialValues?.destinationICAO ?? '')
  const [flightTime, setFlightTime] = useState(initialValues?.flightTime ?? '')
  const [aircraftType, setAircraftType] = useState(initialValues?.aircraftType ?? '')
  const [date, setDate] = useState(initialValues?.date ?? '')
  const [metarInfo, setMetarInfo] = useState(initialValues?.metarInfo ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors(null)
    setIsSubmitting(true)

    try {
      await onSubmit({
        originICAO,
        destinationICAO,
        flightTime: flightTime.length === 5 ? `${flightTime}:00` : flightTime,
        aircraftType,
        date,
        ...(includeMetar ? { metarInfo: metarInfo || null } : {}),
      })
    } catch (err) {
      const apiError = err as ApiError
      setFieldErrors(apiError.fieldErrors)
      setError(apiError.detail ?? apiError.title ?? 'İşlem başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card className="bg-[#00205b] py-6">
        <RouteRibbon
          origin={originICAO.toUpperCase()}
          destination={destinationICAO.toUpperCase()}
          size="md"
          tone="dark"
          animated={!!(originICAO && destinationICAO)}
        />
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kalkış (ICAO)"
              name="originICAO"
              value={originICAO}
              onChange={(e) => setOriginICAO(e.target.value.toUpperCase())}
              maxLength={4}
              errors={fieldErrors?.OriginICAO ?? fieldErrors?.originICAO}
              required
            />
            <Input
              label="Varış (ICAO)"
              name="destinationICAO"
              value={destinationICAO}
              onChange={(e) => setDestinationICAO(e.target.value.toUpperCase())}
              maxLength={4}
              errors={fieldErrors?.DestinationICAO ?? fieldErrors?.destinationICAO}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Tarih"
              name="date"
              type="date"
              icon={CalendarDays}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              errors={fieldErrors?.Date ?? fieldErrors?.date}
              required
            />
            <Input
              label="Uçuş Süresi"
              name="flightTime"
              type="time"
              icon={Clock3}
              value={flightTime}
              onChange={(e) => setFlightTime(e.target.value)}
              errors={fieldErrors?.FlightTime ?? fieldErrors?.flightTime}
              required
            />
          </div>
          <Input
            label="Uçak Tipi"
            name="aircraftType"
            icon={Wrench}
            value={aircraftType}
            onChange={(e) => setAircraftType(e.target.value)}
            errors={fieldErrors?.AircraftType ?? fieldErrors?.aircraftType}
            required
          />
          {includeMetar && (
            <Input
              label="METAR Bilgisi (opsiyonel)"
              name="metarInfo"
              icon={Radio}
              value={metarInfo}
              onChange={(e) => setMetarInfo(e.target.value)}
              errors={fieldErrors?.METARInfo ?? fieldErrors?.metarInfo}
            />
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="command" icon={SubmitIcon} disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </form>
      </Card>
    </div>
  )
}
