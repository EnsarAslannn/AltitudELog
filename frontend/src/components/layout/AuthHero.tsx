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
    <div className="relative hidden flex-1 overflow-hidden bg-navy-900 lg:flex">
      <img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      {/* navy scrim for legibility */}
      <div className="absolute inset-0 hero-scrim" />

      <div className="relative flex flex-1 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <PlaneTakeoff className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">
            Altitud<span className="text-[#f59e0b]">E</span>Log
          </span>
        </div>

        <div className="max-w-md">
          <Eyebrow tone="light" rule={false} className="mb-5">
            {eyebrow}
          </Eyebrow>
          <h1 className="font-display text-display-xl font-bold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200">{subtitle}</p>

          {stat && (
            <div className="mt-10 flex items-center gap-4 border-t border-white/15 pt-6">
              <span className="data text-4xl font-semibold tabular-nums text-white">{stat.value}</span>
              <span className="eyebrow max-w-[10rem] text-[10px] leading-tight text-slate-300">
                {stat.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
