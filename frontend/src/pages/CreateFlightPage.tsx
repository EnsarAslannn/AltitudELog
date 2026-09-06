import { useNavigate } from 'react-router-dom'
import { PlaneTakeoff } from 'lucide-react'
import { flightService } from '../services/flightService'
import { FlightForm, type FlightFormValues } from '../components/flights/FlightForm'
import { Eyebrow } from '../components/ui/Eyebrow'
import { useT } from '../i18n'

export function CreateFlightPage() {
  const navigate = useNavigate()
  const t = useT()

  async function handleSubmit(values: FlightFormValues) {
    await flightService.create({
      originICAO: values.originICAO,
      destinationICAO: values.destinationICAO,
      flightTime: values.flightTime,
      aircraftType: values.aircraftType,
      date: values.date,
    })
    navigate('/dashboard')
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rise">
        <div className="flex flex-col justify-center gap-2">
          <Eyebrow tone="soft" rule={false}>
            {t('createFlight.eyebrow')}
          </Eyebrow>
          <h1 className="on-photo display text-3xl leading-[1.15] text-on-surface sm:text-4xl">
            {t('createFlight.title')}
          </h1>
          <p className="max-w-md text-sm text-on-surface-variant">
            {t('createFlight.subtitle')}
          </p>
        </div>
      </section>

      <FlightForm
        submitLabel={t('createFlight.submit')}
        submittingLabel={t('createFlight.submitting')}
        submitIcon={PlaneTakeoff}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
