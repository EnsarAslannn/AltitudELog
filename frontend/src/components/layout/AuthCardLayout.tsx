import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { PlaneTakeoff } from 'lucide-react'
import { VideoBackdrop } from '../common/VideoBackdrop'

interface AuthCardLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthCardLayout({ title, subtitle, children, footer }: AuthCardLayoutProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <VideoBackdrop />

      <div className="air-surface relative z-10 w-full max-w-md rounded-2xl p-6 shadow-[var(--shadow-panel-hover)] sm:p-9">
        <Link
          to="/"
          className="mb-9 inline-flex w-fit items-center gap-2.5 rounded-lg text-on-surface focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <PlaneTakeoff className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="display text-lg tracking-tight">AltitudELog</span>
        </Link>

        <h1 className="text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-on-surface">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <div className="mt-8 border-t border-outline-variant/60 pt-5 text-sm text-on-surface-variant">
          {footer}
        </div>
      </div>
    </div>
  )
}
