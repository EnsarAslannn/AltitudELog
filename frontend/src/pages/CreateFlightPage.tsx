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
    })
    navigate('/')
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
            Yeni Uçuş Oluştur
          </h1>
          <p className="max-w-md text-sm text-on-surface-variant">
            Uçuş planını mürettebat ataması yapılmadan önce kaydedin.
          </p>
        </div>
      </section>

      <FlightForm
        submitLabel="Uçuşu Oluştur"
        submittingLabel="Oluşturuluyor…"
        submitIcon={PlaneTakeoff}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
