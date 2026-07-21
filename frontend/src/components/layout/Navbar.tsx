import { NavLink, useNavigate } from 'react-router-dom'
import { Crown, GraduationCap, LogOut, PlaneTakeoff, Shield, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import type { PilotRank } from '../../types/auth'

const rankIcon: Record<PilotRank, typeof Shield> = {
  Trainee: GraduationCap,
  FirstOfficer: Shield,
  Captain: ShieldCheck,
  ChiefPilot: Crown,
}

export function Navbar() {
  const { username, rank, logout } = useAuthStore()
  const navigate = useNavigate()
  const isCommand = rank === 'Captain' || rank === 'ChiefPilot'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex items-center gap-1.5 px-1 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:text-white',
      'after:absolute after:-bottom-[17px] after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#f59e0b] after:transition-transform',
      isActive && 'text-white after:scale-x-100',
    )

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#00205b]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 ring-1 ring-white/15">
              <PlaneTakeoff className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-white">
              Altitud<span className="text-[#f59e0b]">E</span>Log
            </span>
          </div>
          <nav className="hidden items-center gap-7 sm:flex">
            <NavLink to="/" end className={linkClass}>
              Uçuşlar
            </NavLink>
            {rank === 'Captain' && (
              <NavLink to="/flights/new" className={linkClass}>
                <PlaneTakeoff className="h-3.5 w-3.5" />
                Yeni Uçuş
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-300 sm:inline">{username}</span>
          {rank && (
            <Badge
              tone={isCommand ? 'amber' : 'neutral'}
              icon={rankIcon[rank]}
              className={cn(isCommand ? '' : 'border-white/20 bg-white/10 text-slate-100')}
            >
              {rank}
            </Badge>
          )}
          <Button
            variant="ghost"
            icon={LogOut}
            onClick={handleLogout}
            className="text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
