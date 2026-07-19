import { Plane } from 'lucide-react'

export function AuthHero() {
  return (
    <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 p-10 md:flex">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div
          className="absolute left-1/2 top-1/2 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 animate-[spin_18s_linear_infinite] rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, rgba(255,255,255,0.3), transparent 30%, transparent 100%)',
          }}
        />
      </div>

      <svg
        viewBox="0 0 400 400"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2"
      >
        <path
          d="M80,300 Q200,80 320,140"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="2 10"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="80" cy="300" r="5" fill="white" />
        <circle cx="80" cy="300" r="11" fill="none" stroke="white" strokeWidth="1.5" opacity="0.4" />
        <circle cx="320" cy="140" r="5" fill="#93c5fd" />
        <circle cx="320" cy="140" r="11" fill="none" stroke="#93c5fd" strokeWidth="1.5" opacity="0.4" />
        <g transform="translate(200,150) rotate(-35)">
          <path d="M0,-16 L6,12 L0,7 L-6,12 Z" fill="white" />
        </g>
      </svg>

      <div className="relative flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 backdrop-blur">
          <Plane className="h-5 w-5 text-white" strokeWidth={2.5} />
        </span>
        <span className="text-xl font-bold tracking-tight text-white">
          Altitud<span className="text-blue-200">E</span>Log
        </span>
      </div>

      <div className="relative">
        <h1 className="text-3xl font-bold leading-tight text-white">
          Uçuş kayıtlarınız,
          <br />
          tek panelde.
        </h1>
        <p className="mt-3 max-w-xs text-sm text-blue-100">
          Mürettebat atamaları, CRM raporları ve uçuş geçmişi — pilotlar için tasarlanmış bir kokpit.
        </p>
      </div>
    </div>
  )
}
