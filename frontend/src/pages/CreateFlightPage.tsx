import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock3, PlaneTakeoff, Radio, Wrench } from 'lucide-react'
import { flightService } from '../services/flightService'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Input } from '../components/ui/Input'
import { RouteRibbon } from '../components/ui/RouteRibbon'
import type { ApiError } from '../types/problemDetails'

export function CreateFlightPage() {
  const [originICAO, setOriginICAO] = useState('')
  const [destinationICAO, setDestinationICAO] = useState('')
  const [flightTime, setFlightTime] = useState('')
  const [aircraftType, setAircraftType] = useState('')
  const [date, setDate] = useState('')
  const [metarInfo, setMetarInfo] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors(null)
    setIsSubmitting(true)

    try {
      await flightService.create({
        originICAO,
        destinationICAO,
        flightTime: `${flightTime}:00`,
        aircraftType,
        date,
        metarInfo: metarInfo || null,
      })
      navigate('/')
    } catch (err) {
      const apiError = err as ApiError
      setFieldErrors(apiError.fieldErrors)
      setError(apiError.detail ?? apiError.title ?? 'Uçuş oluşturulamadı.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <Eyebrow className="mb-3">Captain · Flight Plan</Eyebrow>
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0b1220]">Yeni Uçuş Oluştur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Uçuş planını mürettebat ataması yapılmadan önce kaydedin.
        </p>
      </div>

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
          <Input
            label="METAR Bilgisi (opsiyonel)"
            name="metarInfo"
            icon={Radio}
            value={metarInfo}
            onChange={(e) => setMetarInfo(e.target.value)}
            errors={fieldErrors?.METARInfo ?? fieldErrors?.metarInfo}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" variant="command" icon={PlaneTakeoff} disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor…' : 'Uçuşu Oluştur'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
