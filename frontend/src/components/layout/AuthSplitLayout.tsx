import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { PlaneTakeoff } from 'lucide-react'

interface AuthSplitLayoutProps {
  eyebrow: string
  title: ReactNode
  subtitle: string
  formTitle: string
  formSubtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthSplitLayout({
  eyebrow,
  title,
  subtitle,
  formTitle,
  formSubtitle,
  children,
  footer,
}: AuthSplitLayoutProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative flex min-h-screen">
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#dce8f2] lg:relative lg:inset-auto lg:z-auto lg:flex lg:w-3/4 lg:flex-col lg:justify-between lg:p-12">
        {reduceMotion ? (
          <img
            src="/images/wing-clouds.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="eager"
          />
        ) : (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/air-auth.mp4"
            poster="/images/wing-clouds.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            controls={false}
            disablePictureInPicture
            disableRemotePlayback
            aria-hidden="true"
          />
        )}

        <div className="absolute inset-0 hidden bg-gradient-to-t from-black/65 via-black/10 to-transparent lg:block" />

        <div className="relative hidden lg:block">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-lg text-whiteout focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-blue"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-whiteout/70">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-lg font-medium tracking-tight">AltitudELog</span>
          </Link>
        </div>

        <div className="relative hidden max-w-2xl lg:block">
          <p lang="en" className="eyebrow mb-5 text-xs font-medium text-whiteout/70">
            {eyebrow}
          </p>
          <h2 className="text-[clamp(2.25rem,3.6vw,3.5rem)] font-medium leading-[1.06] tracking-[-0.025em] text-whiteout">
            {title}
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-whiteout/80">{subtitle}</p>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center px-4 py-10 lg:w-1/4 lg:min-w-[380px] lg:shrink-0 lg:items-stretch lg:px-0 lg:py-0">
        <div className="air-surface w-full max-w-sm rounded-2xl p-6 shadow-[var(--shadow-panel-hover)] sm:p-8 lg:flex lg:max-h-screen lg:max-w-none lg:flex-col lg:[justify-content:safe_center] lg:overflow-y-auto lg:rounded-none lg:border-0 lg:border-l lg:border-outline-variant/50 lg:bg-surface-container-lowest lg:p-10 lg:shadow-none lg:backdrop-blur-none xl:p-12">
          <Link
            to="/"
            className="mb-9 inline-flex w-fit items-center gap-2.5 rounded-lg text-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary lg:mb-10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="display text-lg tracking-tight">AltitudELog</span>
          </Link>

          <h1 className="text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-on-surface">
            {formTitle}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{formSubtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 border-t border-outline-variant/60 pt-5 text-sm text-on-surface-variant">
            {footer}
          </div>
        </div>
      </div>
    </div>
  )
}
