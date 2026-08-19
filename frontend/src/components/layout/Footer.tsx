import { PlaneTakeoff } from 'lucide-react'

export function Footer() {
  return (
    <footer className="relative z-10 mt-20 border-t border-outline-variant/30 bg-surface-container-lowest/72 text-on-surface-variant backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <PlaneTakeoff className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <div>
            <p className="display text-base text-on-surface">
              Altitud<span className="text-on-surface">E</span>Log
            </p>
            <p className="text-xs text-outline">Uçuş ve CRM kayıt sistemi</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-outline">
          <span>Flight Ops</span>
          <span>Crew Resource Management</span>
          <span>METAR Feed</span>
        </div>
      </div>
    </footer>
  )
}
