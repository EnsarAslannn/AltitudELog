import { NavLink, useNavigate } from 'react-router-dom'
import { Crown, GraduationCap, LogOut, Plane, PlaneTakeoff, Shield, ShieldCheck } from 'lucide-react'
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

  return (
    <header className="sticky top-0 z-10 border-b border-slate-950/10 bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Plane className="h-4 w-4 text-slate-50" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight text-white">
              Altitud<span className="text-blue-400">E</span>Log
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-400 transition-colors hover:text-white',
                  isActive && 'bg-white/10 text-blue-400',
                )
              }
            >
              Uçuşlar
            </NavLink>
            {rank === 'Captain' && (
              <NavLink
                to="/flights/new"
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-400 transition-colors hover:text-white',
                    isActive && 'bg-white/10 text-blue-400',
                  )
                }
              >
                <PlaneTakeoff className="h-3.5 w-3.5" />
                Yeni Uçuş
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{username}</span>
          {rank && (
            <Badge tone={isCommand ? 'amber' : 'blue'} icon={rankIcon[rank]}>
              {rank}
            </Badge>
          )}
          <Button variant="secondary" icon={LogOut} onClick={handleLogout}>
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  )
}
