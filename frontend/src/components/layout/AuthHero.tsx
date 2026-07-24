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
    <div className="relative hidden flex-1 overflow-hidden bg-void-950 scanlines lg:flex">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover hero-photo"
        loading="eager"
      />
      {/* near-black scrim for legibility */}
      <div className="absolute inset-0 hero-scrim" />

      <div className="relative flex flex-1 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-phosphor-500/10 ring-1 ring-phosphor-500/25 backdrop-blur">
            <PlaneTakeoff className="h-5 w-5 text-phosphor-400" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-mist-100">
            Altitud<span className="text-command-500">E</span>Log
          </span>
        </div>

        <div className="max-w-md">
          <Eyebrow tone="light" rule={false} className="mb-5">
            {eyebrow}
          </Eyebrow>
          <h1 className="font-display text-display-xl font-bold tracking-tight text-mist-100">
            {title}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist-100/80">{subtitle}</p>

          {stat && (
            <div className="mt-10 flex items-center gap-4 border-t border-phosphor-500/20 pt-6">
              <span className="data text-4xl font-semibold tabular-nums text-phosphor-300">{stat.value}</span>
              <span className="eyebrow max-w-[10rem] text-[10px] leading-tight text-mist-300">
                {stat.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
