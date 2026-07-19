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

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-slate-50/70 backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2.5">
            <span className="glow-blue flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Plane className="h-4 w-4 text-slate-50" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Altitud<span className="text-blue-500">E</span>Log
            </span>
          </div>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900',
                  isActive && 'bg-blue-600/10 text-blue-500',
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
                    'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-slate-500 transition-colors hover:text-slate-900',
                    isActive && 'bg-blue-600/10 text-blue-500',
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
          <span className="text-sm text-slate-500">{username}</span>
          {rank && (
            <Badge tone="blue" icon={rankIcon[rank]}>
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
