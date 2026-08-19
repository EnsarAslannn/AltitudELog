import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useReducedMotion } from 'framer-motion'
import { PlaneTakeoff } from 'lucide-react'

interface AuthSplitLayoutProps {
  eyebrow: string
  title: ReactNode
  subtitle: string
  /** Heading of the form column itself, e.g. "Giriş Yap". */
  formTitle: string
  formSubtitle: string
  /** The form. Rendered on an opaque surface — see the note on the panel below. */
  children: ReactNode
  /** Rendered under a hairline at the foot of the panel: the cross-link to the other page. */
  footer: ReactNode
}

/**
 * The authentication shell: clip on the left, form on the right.
 *
 * The split is three quarters / one quarter from `lg` up, with a 380px floor on
 * the panel. A literal quarter is 360px at 1440 and holds a labelled form
 * comfortably, but the same fraction is 320px at 1280 and 256px at 1024 — narrow
 * enough that a date field and its label stop fitting on one line. The floor only
 * engages below ~1520px, so on the displays this is designed for the ratio is
 * exactly as specified.
 *
 * Below `lg` there is no split to make: the clip becomes a fixed backdrop for the
 * whole viewport and the panel floats on it as a frosted card.
 *
 * The panel is opaque on purpose, and it is the one place in this redesign that
 * covers the footage rather than sitting on it. Labels, inputs, validation
 * messages and error text are small, dense, and must be legible on every frame of
 * a moving clip, which no scrim can guarantee; a marketing headline at 48px can.
 * So the headline sits on open sky and the form sits on a surface.
 */
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
      {/*
        The clip pane. `fixed` below lg so it backs the whole viewport, `relative`
        from lg up so it becomes the left three quarters of a real two-column
        layout.
      */}
      <div className="fixed inset-0 -z-10 overflow-hidden bg-[#dce8f2] lg:relative lg:inset-auto lg:z-auto lg:flex lg:w-3/4 lg:flex-col lg:justify-between lg:p-12">
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

        {/*
          Bottom-weighted only, and only from lg — where the headline actually
          sits. The top three fifths of the clip stay completely unmodified, so the
          aircraft and the sky read exactly as shot.
        */}
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

      {/* The form pane. */}
      <div className="relative flex w-full items-center justify-center px-4 py-10 lg:w-1/4 lg:min-w-[380px] lg:shrink-0 lg:items-stretch lg:px-0 lg:py-0">
        {/*
          `safe center` rather than plain centring. Login's form is shorter than
          the panel and should sit in the middle of it; Register's nine fields are
          taller than any laptop screen, and a plain `justify-center` on a
          scrollable flex column pushes the overflow out of BOTH ends — the brand
          lockup and the heading become unreachable, because there is nothing above
          scrollTop 0 to scroll back to. `safe` falls back to flex-start exactly in
          that case. A browser too old to parse it ignores the declaration and
          top-aligns, which is the same fallback.
        */}
        <div className="air-surface w-full max-w-sm rounded-2xl p-6 shadow-[var(--shadow-panel-hover)] sm:p-8 lg:flex lg:max-h-screen lg:max-w-none lg:flex-col lg:[justify-content:safe_center] lg:overflow-y-auto lg:rounded-none lg:border-0 lg:border-l lg:border-outline-variant/50 lg:bg-surface-container-lowest lg:p-10 lg:shadow-none lg:backdrop-blur-none xl:p-12">
          {/* Brand lockup, panel-side. Below lg the clip pane is a backdrop with
              no chrome of its own, so this is the only way back to the landing
              page from a phone. */}
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
