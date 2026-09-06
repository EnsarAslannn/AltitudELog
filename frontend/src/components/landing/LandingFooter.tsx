import { Link } from 'react-router-dom'
import { PlaneTakeoff } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useT } from '../../i18n'

export function LandingFooter() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const t = useT()

  const linkClass =
    'air-underline w-fit text-sm font-medium text-[color:var(--air-accent)] transition-opacity hover:opacity-70'

  const sectionLinkClass =
    'w-fit text-sm font-medium text-[color:var(--air-fg-muted)] transition-colors hover:text-[color:var(--air-fg)]'

  return (
    <footer className="border-t border-[color:var(--air-rule)] py-14">
      <div className="relative z-30 mx-auto flex max-w-[1150px] flex-col gap-10 px-5 sm:px-8 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--air-fg)]/40 text-[color:var(--air-fg)]">
              <PlaneTakeoff className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-lg font-medium tracking-tight text-[color:var(--air-fg)]">AltitudELog</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--air-fg-muted)]">
            {t('landing.footer.tagline')}
          </p>
        </div>

        <nav className="flex flex-col gap-3" aria-label={t('landing.footer.bottomMenu')}>
          <span className="eyebrow text-xs font-medium text-[color:var(--air-fg-muted)]">
            {t('landing.footer.account')}
          </span>
          {isAuthenticated ? (
            <Link to="/dashboard" className={linkClass}>
              {t('cta.dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/login" className={linkClass}>
                {t('cta.login')}
              </Link>
              <Link to="/register" className={linkClass}>
                {t('cta.register')}
              </Link>
              <Link to="/forgot-password" className={linkClass}>
                {t('landing.footer.forgotPassword')}
              </Link>
            </>
          )}
        </nav>

        <nav className="flex flex-col gap-3" aria-label={t('landing.footer.sections')}>
          <span className="eyebrow text-xs font-medium text-[color:var(--air-fg-muted)]">
            {t('landing.footer.sections')}
          </span>
          <a href="#ucus-kaydi" className={sectionLinkClass}>
            {t('landing.footer.flightLog')}
          </a>
          <a href="#crm" className={sectionLinkClass}>
            {t('landing.footer.crm')}
          </a>
          <a href="#logbook" className={sectionLinkClass}>
            {t('landing.footer.logbook')}
          </a>
        </nav>
      </div>

      <div className="relative z-30 mx-auto mt-12 max-w-[1150px] border-t border-[color:var(--air-rule)] px-5 pt-6 sm:px-8">
        <p className="text-xs text-[color:var(--air-fg-muted)]">
          {t('landing.footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  )
}
