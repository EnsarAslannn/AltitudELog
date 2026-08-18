import { Link } from 'react-router-dom'
import { PlaneTakeoff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'
import { toneClass, type SectionTone } from './tones'

export function LandingFooter({ tone }: { tone: SectionTone }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const linkClass =
    'air-underline w-fit text-sm font-medium text-[color:var(--air-accent)] transition-opacity hover:opacity-70'

  const sectionLinkClass =
    'w-fit text-sm font-medium text-[color:var(--air-fg-muted)] transition-colors hover:text-[color:var(--air-fg)]'

  return (
    <footer data-nav-tone={tone} className={cn(toneClass[tone], 'air-ground py-14')}>
      <div className="relative z-30 mx-auto flex max-w-[1150px] flex-col gap-10 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--air-fg)]/40 text-[color:var(--air-fg)]">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-lg font-medium tracking-tight text-[color:var(--air-fg)]">AltitudELog</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--air-fg-soft)]">
            Uçuş, mürettebat ve CRM kayıtları için tek operasyon defteri.
          </p>
        </div>

        {/* Auth-aware, like every other call to action on the page: offering
            "Hesap Oluştur" to someone already signed in is a dead end. */}
        <nav className="flex flex-col gap-3" aria-label="Alt menü">
          <span className="eyebrow text-xs font-medium text-[color:var(--air-fg-soft)]">Hesap</span>
          {isAuthenticated ? (
            <Link to="/dashboard" className={linkClass}>
              Panele Git
            </Link>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                Giriş Yap
              </Link>
              <Link to="/register" className={linkClass}>
                Hesap Oluştur
              </Link>
              <Link to="/forgot-password" className={linkClass}>
                Şifremi Unuttum
              </Link>
            </>
          )}
        </nav>

        <nav className="flex flex-col gap-3" aria-label="Bölümler">
          <span className="eyebrow text-xs font-medium text-[color:var(--air-fg-soft)]">Bölümler</span>
          <a href="#ucus-kaydi" className={sectionLinkClass}>
            Uçuş Kaydı
          </a>
          <a href="#crm" className={sectionLinkClass}>
            CRM Raporları
          </a>
          <a href="#logbook" className={sectionLinkClass}>
            Logbook
          </a>
        </nav>
      </div>

      <div className="relative z-30 mx-auto mt-12 max-w-[1150px] border-t border-[color:var(--air-rule)] px-5 pt-6 sm:px-8">
        <p className="text-xs text-[color:var(--air-fg-soft)]">
          © {new Date().getFullYear()} AltitudELog — Flight &amp; CRM Logbook.
        </p>
      </div>
    </footer>
  )
}
