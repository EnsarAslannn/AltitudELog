import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, Clock3, PlaneTakeoff, Radio, Wrench } from 'lucide-react'
import { flightService } from '../services/flightService'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
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
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <PlaneTakeoff className="h-5 w-5 text-blue-500" />
          Yeni Uçuş Oluştur
        </h1>
        <p className="text-sm text-slate-500">Uçuş planını mürettebat ataması yapılmadan önce kaydedin.</p>
      </div>

      {(originICAO || destinationICAO) && (
        <Card className="flex items-center justify-center gap-3 py-4">
          <span className="text-lg font-bold text-slate-900">{originICAO.toUpperCase() || '····'}</span>
          <span className="flex items-center gap-1 text-blue-500">
            <span className="h-px w-8 border-t border-dashed border-slate-400" />
            <PlaneTakeoff className="h-4 w-4" />
            <span className="h-px w-8 border-t border-dashed border-slate-400" />
          </span>
          <span className="text-lg font-bold text-slate-900">{destinationICAO.toUpperCase() || '····'}</span>
        </Card>
      )}

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
          <Button type="submit" icon={PlaneTakeoff} disabled={isSubmitting}>
            {isSubmitting ? 'Oluşturuluyor…' : 'Uçuşu Oluştur'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
