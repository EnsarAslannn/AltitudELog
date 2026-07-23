import { useNavigate } from 'react-router-dom'
import { PlaneTakeoff } from 'lucide-react'
import { flightService } from '../services/flightService'
import { FlightForm, type FlightFormValues } from '../components/flights/FlightForm'
import { Eyebrow } from '../components/ui/Eyebrow'

export function CreateFlightPage() {
  const navigate = useNavigate()

  async function handleSubmit(values: FlightFormValues) {
    await flightService.create({
      originICAO: values.originICAO,
      destinationICAO: values.destinationICAO,
      flightTime: values.flightTime,
      aircraftType: values.aircraftType,
      date: values.date,
      metarInfo: null,
    })
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-lg">
        <Eyebrow className="mb-3">Captain · Flight Plan</Eyebrow>
        <h1 className="font-display text-display-lg font-bold tracking-tight text-[#0b1220]">Yeni Uçuş Oluştur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Uçuş planını mürettebat ataması yapılmadan önce kaydedin.
        </p>
      </div>

      <FlightForm
        submitLabel="Uçuşu Oluştur"
        submittingLabel="Oluşturuluyor…"
        submitIcon={PlaneTakeoff}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
