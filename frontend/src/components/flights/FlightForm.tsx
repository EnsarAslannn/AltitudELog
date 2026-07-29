import { useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Clock3, Info, PlaneTakeoff, Wrench } from 'lucide-react'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Combobox } from '../ui/Combobox'
import { Input } from '../ui/Input'
import { RouteRibbon } from '../ui/RouteRibbon'
import { airports } from '../../data/airports'
import { aircraftTypes } from '../../data/aircraftTypes'
import { apiErrorMessage } from '../../lib/apiMessages'
import type { ApiError } from '../../types/problemDetails'

export interface FlightFormValues {
  originICAO: string
  destinationICAO: string
  flightTime: string
  aircraftType: string
  date: string
}

interface FlightFormProps {
  initialValues?: Partial<FlightFormValues>
  submitLabel: string
  submittingLabel: string
  submitIcon?: typeof PlaneTakeoff
  onSubmit: (values: FlightFormValues) => Promise<void>
}

export function FlightForm({
  initialValues,
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const airportOptions = useMemo(
    () =>
      airports.map((a) => ({
        value: a.icao,
        label: `${a.name} (${a.icao})`,
        sublabel: `${a.city}, ${a.country}`,
      })),
    [],
  )

  const aircraftOptions = useMemo(
    () => aircraftTypes.map((t) => ({ value: t.code, label: `${t.code} — ${t.label}` })),
    [],
  )

  // Backend rejects future flight dates (CreateFlightCommandValidator/UpdateFlightCommandValidator);
  // block them in the date picker itself instead of only surfacing it via a round-trip 400.
  const maxDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

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
      })
    } catch (err) {
      const apiError = err as ApiError
      setFieldErrors(apiError.fieldErrors)
      setError(apiErrorMessage(apiError, 'İşlem başarısız.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <Card className="bg-surface-container-low py-6">
        <RouteRibbon
          origin={originICAO.toUpperCase()}
          destination={destinationICAO.toUpperCase()}
          size="md"
          emphasis="strong"
          animated={!!(originICAO && destinationICAO)}
        />
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Combobox
              label="Kalkış (ICAO)"
              name="originICAO"
              value={originICAO}
              onChange={(v) => setOriginICAO(v.toUpperCase())}
              options={airportOptions}
              errors={fieldErrors?.OriginICAO ?? fieldErrors?.originICAO}
              required
            />
            <Combobox
              label="Varış (ICAO)"
              name="destinationICAO"
              value={destinationICAO}
              onChange={(v) => setDestinationICAO(v.toUpperCase())}
              options={airportOptions}
              errors={fieldErrors?.DestinationICAO ?? fieldErrors?.destinationICAO}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Tarih"
              name="date"
              type="date"
              icon={CalendarDays}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={maxDate}
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
          <Combobox
            label="Uçak Tipi"
            name="aircraftType"
            icon={Wrench}
            value={aircraftType}
            onChange={setAircraftType}
            options={aircraftOptions}
            errors={fieldErrors?.AircraftType ?? fieldErrors?.aircraftType}
            required
          />
          <div className="flex items-start gap-2 rounded border border-outline-variant/40 bg-surface-container-low p-3 text-xs text-on-surface-variant">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant" />
            <p>METAR bilgisi, uçuş kaydedildikten sonra sistem tarafından otomatik olarak alınır.</p>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <Button type="submit" variant="primary" icon={SubmitIcon} disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </form>
      </Card>
    </div>
  )
}
