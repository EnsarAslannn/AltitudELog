import {
  CloudSun,
  FileDown,
  ShieldCheck,
  Siren,
  Users,
  CalendarClock,
} from 'lucide-react'
import { useT } from '../../i18n'
import { Reveal } from './Reveal'

const capabilities = [
  { icon: CloudSun, key: 'metar' },
  { icon: ShieldCheck, key: 'rank' },
  { icon: Users, key: 'crew' },
  { icon: Siren, key: 'report' },
  { icon: CalendarClock, key: 'certs' },
  { icon: FileDown, key: 'export' },
] as const

export function CapabilityGrid() {
  const t = useT()

  return (
    <section id="yetenekler" className="scroll-mt-24 py-20 sm:py-28">
      <div className="relative z-30 mx-auto max-w-[1150px] px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="eyebrow mb-5 text-xs font-medium text-[color:var(--air-accent)]">
            {t('landing.capabilities.eyebrow')}
          </p>
          <h2 className="text-[clamp(1.75rem,3.4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[color:var(--air-fg)]">
            {t('landing.capabilities.title')}
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, key }, index) => (
            <Reveal
              as="li"
              key={key}
              delay={index * 0.05}
              className="border-t border-[color:var(--air-rule)] pb-9 pt-6"
            >
              <Icon className="h-5 w-5 text-[color:var(--air-accent)]" strokeWidth={1.75} aria-hidden="true" />
              <h3 className="mt-5 text-lg font-medium text-[color:var(--air-fg)]">
                {t(`landing.capability.${key}.title`)}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-[color:var(--air-fg-muted)]">
                {t(`landing.capability.${key}.body`)}
              </p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
