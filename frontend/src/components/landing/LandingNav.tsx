import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, PlaneTakeoff, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'
import { toneClass, type SectionTone } from './tones'

const sections = [
  { href: '#ucus-kaydi', label: 'Uçuş Kaydı' },
  { href: '#crm', label: 'CRM' },
  { href: '#logbook', label: 'Logbook' },
  { href: '#yetenekler', label: 'Yetenekler' },
]

/** Height of the bar. The tone observer measures against this exact value. */
const NAV_HEIGHT = 72

function isTone(value: string | null): value is SectionTone {
  return value === 'dark' || value === 'blue' || value === 'cream'
}

/**
 * Glassmorphism top bar that takes on the colour of whatever section is currently
 * passing beneath it.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [tone, setTone] = useState<SectionTone>('dark')
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const marked = [...document.querySelectorAll<HTMLElement>('[data-nav-tone]')]
    if (marked.length === 0) return

    /*
     * The viewport is collapsed to a one-pixel band immediately below the bar, so
     * "the section currently in view" means the section the bar is actually
     * sitting on — not whichever section happens to occupy the most screen. A
     * plain majority-visible observer flips the colour a screen early on tall
     * sections and gets stuck on short ones.
     *
     * Reading positions on scroll instead would work too, but would run layout
     * queries every frame for a value that changes a handful of times per page.
     */
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const next = entry.target.getAttribute('data-nav-tone')
          if (isTone(next)) setTone(next)
        }
      },
      { rootMargin: `-${NAV_HEIGHT}px 0px -100% 0px`, threshold: 0 },
    )

    for (const el of marked) observer.observe(el)
    return () => observer.disconnect()
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

  // No display utility in these base strings. "hidden sm:inline-flex" and a
  // baked-in "inline-flex" both set `display`, and which one wins is decided by
  // Tailwind's stylesheet order, not by the order they appear in the class
  // attribute — so the register button stayed visible at 390px and shoved the
  // menu toggle off the edge. Each call site now states its own display.
  const ghostButton =
    'min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-current px-4 py-2.5 text-sm font-medium text-[color:var(--air-fg)] transition-colors hover:bg-[color:var(--air-nav-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue'

  // Stays ink-on-light in every tone: this is the page's one filled action, and
  // flipping it per section would make the primary CTA look like a different
  // control four times on the way down.
  const solidButton =
    'min-h-11 items-center justify-center whitespace-nowrap rounded-lg border border-ink bg-haze px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-whiteout focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue'

  return (
    <header
      className={cn(
        'air-nav fixed inset-x-0 top-0 z-50',
        toneClass[tone],
        scrolled && 'air-nav-solid',
      )}
    >
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
            <Link to="/dashboard" className={cn('inline-flex', solidButton)}>
              Panele Git
            </Link>
          ) : (
            <>
              <Link to="/login" className={cn('inline-flex', ghostButton)}>
                Giriş Yap
              </Link>
              <Link to="/register" className={cn('hidden sm:inline-flex', solidButton)}>
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
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--air-rule)] text-[color:var(--air-fg)] transition-colors hover:bg-[color:var(--air-nav-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-menu"
          className="border-t border-[color:var(--air-rule)] bg-[color:var(--air-nav-bg-solid)] lg:hidden"
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
                className="mt-4 flex min-h-12 items-center justify-center rounded-lg border border-ink bg-haze text-base font-medium text-ink sm:hidden"
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
