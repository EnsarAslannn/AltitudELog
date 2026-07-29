import { NavLink, useNavigate } from 'react-router-dom'
import { BarChart3, Crown, GraduationCap, LogOut, PlaneTakeoff, Shield, ShieldCheck, User } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { cn } from '../../lib/cn'
import { hasCommandRank } from '../../routes/ranks'
import type { PilotRank } from '../../types/auth'

const rankIcon: Record<PilotRank, typeof Shield> = {
  Trainee: GraduationCap,
  FirstOfficer: Shield,
  Captain: ShieldCheck,
  ChiefPilot: Crown,
}

export function Navbar() {
  const { username, rank, pilotId, logout } = useAuthStore()
  const navigate = useNavigate()
  const isCommand = hasCommandRank(rank)

  function handleLogout() {
    // Best-effort: revoke the refresh token server-side so it can't be used to silently
    // renew a session after this point. Client-side logout proceeds either way — a failed
    // revoke call (e.g. the access token already expired) shouldn't block signing out.
    authService.logout().catch(() => {})
    logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative flex items-center gap-1.5 px-1 py-1.5 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface',
      'after:absolute after:-bottom-[17px] after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-primary after:transition-transform',
      isActive && 'text-on-surface after:scale-x-100',
    )

  // Pill styling for the same destinations on narrow screens, where the underline
  // treatment above has no room to breathe.
  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
      isActive
        ? 'border-primary bg-primary text-on-primary'
        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant',
    )

  /*
   * One source of truth for the destinations, rendered twice: as an inline underline
   * nav from `sm` up, and as a scrollable pill row below the brand bar underneath it.
   * Before this the nav was `hidden sm:flex` with no mobile counterpart at all, which
   * left phone users with no way to reach Yeni Uçuş, Profil or İstatistikler.
   */
  const destinations = [
    { to: '/', label: 'Uçuşlar', icon: null, end: true, show: true },
    { to: '/flights/new', label: 'Yeni Uçuş', icon: PlaneTakeoff, end: false, show: isCommand },
    { to: `/pilots/${pilotId}`, label: 'Profil', icon: User, end: false, show: !!pilotId },
    { to: '/admin/stats', label: 'İstatistikler', icon: BarChart3, end: false, show: isCommand },
  ].filter((d) => d.show)

  return (
    <header className="sticky top-0 z-20 border-b border-outline-variant/30 bg-surface-container-lowest/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-on-primary">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <span className="display text-xl text-on-surface">
              Altitud<span className="text-on-surface">E</span>Log
            </span>
          </div>
          <nav className="hidden items-center gap-7 sm:flex" aria-label="Ana menü">
            {destinations.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={linkClass}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-on-surface-variant sm:inline">{username}</span>
          {rank && (
            <Badge tone={isCommand ? 'solid' : 'neutral'} icon={rankIcon[rank]}>
              {rank}
            </Badge>
          )}
          <Button
            variant="ghost"
            icon={LogOut}
            onClick={handleLogout}
            className="text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
          >
            <span className="hidden sm:inline">Çıkış</span>
          </Button>
        </div>
      </div>

      {/* Mobile destinations — scrolls sideways rather than wrapping or overflowing */}
      <nav
        className="flex gap-2 overflow-x-auto border-t border-outline-variant/30 px-4 pb-3 pt-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Ana menü"
      >
        {destinations.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileLinkClass}>
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
