import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'
import { useT } from '../../i18n'
import { ghostCta, solidCta } from './ctas'

export function HeroSection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const t = useT()

  return (
    <section className="relative flex min-h-[100svh] items-end">
      <div className="relative z-30 mx-auto w-full max-w-[1150px] px-5 pb-20 pt-32 sm:px-8 sm:pb-28">
        <p lang="en" className="eyebrow mb-6 text-xs font-medium text-[color:var(--air-accent)] sm:text-[13px]">
          {t('landing.hero.eyebrow')}
        </p>

        <h1 className="max-w-3xl text-[clamp(2.5rem,7vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.025em] text-[color:var(--air-fg)]">
          {t('landing.hero.titleLead')}
          <br />
          <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">
            {t('landing.hero.titleAccent')}
          </span>{' '}
          {t('landing.hero.titleTail')}
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-[color:var(--air-fg-muted)]">
          {t('landing.hero.body')}
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className={cn('inline-flex', solidCta)}>
              {t('cta.dashboard')}
            </Link>
          ) : (
            <>
              <Link to="/register" className={cn('inline-flex', solidCta)}>
                {t('cta.register')}
              </Link>
              <Link to="/login" className={cn('inline-flex', ghostCta)}>
                {t('cta.login')}
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
