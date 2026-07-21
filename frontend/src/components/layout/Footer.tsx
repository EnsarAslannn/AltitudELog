import { PlaneTakeoff } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#00205b] text-slate-300">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
            <PlaneTakeoff className="h-4 w-4 text-white" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display text-sm font-bold tracking-tight text-white">
              Altitud<span className="text-[#f59e0b]">E</span>Log
            </p>
            <p className="text-xs text-slate-400">Uçuş ve CRM kayıt sistemi</p>
          </div>
        </div>
        <div className="data flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
          <span>Flight Ops</span>
          <span>Crew Resource Management</span>
          <span>METAR Feed</span>
        </div>
      </div>
    </footer>
  )
}
