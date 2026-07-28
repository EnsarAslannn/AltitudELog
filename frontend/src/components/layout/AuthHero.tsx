import { PlaneTakeoff } from 'lucide-react'
import { Eyebrow } from '../ui/Eyebrow'

interface AuthHeroProps {
  image?: string
  eyebrow: string
  title: React.ReactNode
  subtitle: string
  stat?: { value: string; label: string }
}

export function AuthHero({
  image = '/images/hero-approach.jpg',
  eyebrow,
  title,
  subtitle,
  stat,
}: AuthHeroProps) {
  return (
    <div className="relative hidden flex-1 overflow-hidden bg-surface lg:flex">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      {/* light scrim fading the photo into the surface color for legibility */}
      <div className="absolute inset-0 hero-scrim" />

      <div className="relative flex flex-1 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container/40 ring-1 ring-primary/20 backdrop-blur">
            <PlaneTakeoff className="h-5 w-5 text-primary" strokeWidth={2.5} />
          </span>
          <span className="text-xl font-bold tracking-tight text-on-primary">
            Altitud<span className="text-command">E</span>Log
          </span>
        </div>

        <div className="max-w-md">
          <Eyebrow tone="light" rule={false} className="mb-5">
            {eyebrow}
          </Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-on-primary">
            {title}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-primary/80">{subtitle}</p>

          {stat && (
            <div className="mt-10 flex items-center gap-4 border-t border-on-primary/20 pt-6">
              <span className="data text-4xl font-semibold tabular-nums text-on-primary">{stat.value}</span>
              <span className="eyebrow max-w-[10rem] text-[10px] leading-tight text-on-primary/70">
                {stat.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
