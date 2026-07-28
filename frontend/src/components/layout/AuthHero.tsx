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
        className="photo-rich absolute inset-0 h-full w-full object-cover"
        loading="eager"
      />
      {/* bottom-weighted scrim: copy sits on solid surface, photo stays open up top */}
      <div className="absolute inset-0 hero-scrim-panel" />

      <div className="relative flex flex-1 flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
            <PlaneTakeoff className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="display text-xl text-on-surface">
            Altitud<span className="text-on-surface">E</span>Log
          </span>
        </div>

        <div className="max-w-md">
          <Eyebrow tone="soft" rule={false} className="mb-5">
            {eyebrow}
          </Eyebrow>
          <h1 className="display text-4xl leading-[1.1] text-on-surface sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>

          {stat && (
            <div className="mt-10 flex items-center gap-4 border-t border-outline-variant pt-6 float-slow">
              <span className="data text-4xl font-semibold tabular-nums text-on-surface">
                {stat.value}
              </span>
              <span className="eyebrow max-w-[10rem] text-[10px] leading-tight text-on-surface-variant">
                {stat.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
