import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { PlaneTakeoff } from 'lucide-react'

interface AuthVideoLayoutProps {
  eyebrow: string
  title: ReactNode
  subtitle: string
  /** The form card. Rendered on an opaque surface, so it keeps the app's own styling. */
  children: ReactNode
}

/**
 * Full-bleed video shell for the authentication pages.
 *
 * The copy sits directly on the footage while the form sits on an opaque card —
 * a deliberate split. Labels, inputs, validation messages and error text are
 * dense, small and must be legible on every frame of a moving clip, which no
 * scrim can guarantee; a marketing headline at 40px can. So the card is solid
 * and the form inside it keeps the application's own light styling unchanged.
 */
export function AuthVideoLayout({ eyebrow, title, subtitle, children }: AuthVideoLayoutProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative min-h-screen overflow-hidden bg-black-void">
      {/*
        Under `prefers-reduced-motion` the poster replaces the video outright
        rather than the video being paused: a looping background clip is exactly
        the indefinite motion WCAG 2.2.2 asks to be stoppable, and there is no
        honest place to put a pause control on a decorative full-page backdrop.
      */}
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

      <div className="air-auth-scrim absolute inset-0" />

      <div className="relative flex min-h-screen flex-col">
        <header className="px-5 pt-6 sm:px-10 sm:pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-lg text-whiteout focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-blue"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-whiteout/70">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-lg font-medium tracking-tight">AltitudELog</span>
          </Link>
        </header>

        <div className="mx-auto flex w-full max-w-[1150px] flex-1 items-center px-5 py-10 sm:px-8">
          <div className="grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Copy column. Hidden below `lg` rather than stacked: on a phone the
                form is the whole job, and a headline above it would push the
                first input below the fold on most handsets. */}
            <div className="hidden lg:block">
              <p lang="en" className="eyebrow mb-5 text-xs font-medium text-signal-blue">
                {eyebrow}
              </p>
              <h2 className="text-[clamp(2rem,3.6vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-whiteout">
                {title}
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-whiteout/75">{subtitle}</p>
            </div>

            <div className="flex justify-center lg:justify-end">{children}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
