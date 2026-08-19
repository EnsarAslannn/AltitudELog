import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, PlaneTakeoff, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'
import { ghostCta, solidCta } from './ctas'

const sections = [
  { href: '#ucus-kaydi', label: 'Uçuş Kaydı' },
  { href: '#crm', label: 'CRM' },
  { href: '#logbook', label: 'Logbook' },
  { href: '#yetenekler', label: 'Yetenekler' },
]

/**
 * Glassmorphism top bar.
 *
 * It used to recolour itself from a `data-nav-tone` attribute on whichever
 * section was passing beneath it, via an IntersectionObserver collapsed to a
 * 1px band under the bar. That machinery is gone along with the tones it read:
 * the page is now one continuous stretch of unmodified sky, so there is no
 * second ground for the bar to change into. What remains is the part that still
 * describes something real — transparent while it floats over the hero, a light
 * veil once dense copy starts passing underneath.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The sheet locks the page behind it; without this the body scrolls under the
  // open menu on iOS and the reader loses their place on a page this long.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // No display utility in the imported CTA strings. "hidden sm:inline-flex" and a
  // baked-in "inline-flex" both set `display`, and which one wins is decided by
  // Tailwind's stylesheet order, not by the order they appear in the class
  // attribute — so the register button stayed visible at 390px and shoved the
  // menu toggle off the edge. Each call site states its own display.
  const compact = 'min-h-11 px-4 py-2.5'

  return (
    <header className={cn('air-nav fixed inset-x-0 top-0 z-50', scrolled && 'air-nav-scrolled')}>
      <div className="mx-auto flex h-18 max-w-[1150px] items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          to="/"
          className="flex items-center gap-2.5 rounded-lg text-[color:var(--air-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-blue"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-current">
            <PlaneTakeoff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="text-lg font-medium tracking-tight">AltitudELog</span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Sayfa bölümleri">
          {sections.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-[color:var(--air-fg-muted)] transition-colors hover:text-[color:var(--air-fg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-blue"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className={cn('inline-flex', solidCta, compact)}>
              Panele Git
            </Link>
          ) : (
            <>
              <Link to="/login" className={cn('inline-flex', ghostCta, compact)}>
                Giriş Yap
              </Link>
              <Link to="/register" className={cn('hidden sm:inline-flex', solidCta, compact)}>
                Hesap Oluştur
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="landing-menu"
            aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--air-fg)]/30 text-[color:var(--air-fg)] transition-colors hover:bg-[color:var(--air-fg)]/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-menu"
          className="air-surface border-t border-[color:var(--air-rule)] lg:hidden"
        >
          <nav className="mx-auto flex max-w-[1150px] flex-col px-5 py-3 sm:px-8" aria-label="Sayfa bölümleri">
            {sections.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className="flex min-h-12 items-center border-b border-[color:var(--air-rule)] text-base font-medium text-[color:var(--air-fg-muted)] transition-colors last:border-b-0 hover:text-[color:var(--air-fg)]"
              >
                {label}
              </a>
            ))}
            {!isAuthenticated && (
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className={cn('mt-4 flex sm:hidden', solidCta)}
              >
                Hesap Oluştur
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
