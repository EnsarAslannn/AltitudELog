import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/cn'
import { useT, type Translate, type TranslationKey } from '../i18n'
import { VideoBackdrop } from '../components/common/VideoBackdrop'
import { LandingNav } from '../components/landing/LandingNav'
import { SculptureLayer } from '../components/landing/SculptureLayer'
import { HeroSection } from '../components/landing/HeroSection'
import { FeatureBlock } from '../components/landing/FeatureBlock'
import { CapabilityGrid } from '../components/landing/CapabilityGrid'
import { LandingFooter } from '../components/landing/LandingFooter'
import { ghostCta, solidCta } from '../components/landing/ctas'
import { Reveal } from '../components/landing/Reveal'

const marks = [
  { value: 'ICAO', labelKey: 'landing.mark.icao' },
  { value: 'METAR', labelKey: 'landing.mark.metar' },
  { value: 'CRM', labelKey: 'landing.mark.crm' },
  { value: 'CSV · PDF', labelKey: 'landing.mark.export' },
] as const

const featureBlocks = [
  { id: 'ucus-kaydi', prefix: 'landing.flightLog', image: '/images/report2.png', reverse: false },
  { id: 'crm', prefix: 'landing.crm', image: '/images/report1.png', reverse: true },
  { id: 'logbook', prefix: 'landing.logbook', image: '/images/report3.png', reverse: false },
] as const

/**
 * The headlines break across a line and pick out one word in the cursive accent face, so each
 * one is stored as lead/accent/tail rather than a single string — the accent lands on a
 * different word in each language and the split is what lets it move.
 */
function accentedTitle(t: Translate, prefix: string) {
  return (
    <>
      {t(`${prefix}.titleLead` as TranslationKey)}
      <br />
      <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">
        {t(`${prefix}.titleAccent` as TranslationKey)}
      </span>{' '}
      {t(`${prefix}.titleTail` as TranslationKey)}
    </>
  )
}

export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const t = useT()

  useEffect(() => {
    const previous = document.body.style.backgroundColor
    document.body.style.backgroundColor = '#dce8f2'
    return () => {
      document.body.style.backgroundColor = previous
    }
  }, [])

  return (
    <div className="air-page relative min-h-screen">
      <VideoBackdrop />
      <SculptureLayer />
      <LandingNav />

      <main className="relative">
        <HeroSection />

        <section aria-label={t('landing.highlights')} className="relative z-30">
          <ul className="mx-auto grid max-w-[1150px] grid-cols-2 px-5 sm:grid-cols-4 sm:px-8">
            {marks.map(({ value, labelKey }) => (
              <li key={value} className="border-t border-[color:var(--air-rule)] py-8 pr-5 sm:pr-8">
                <p className="data text-xl font-medium tracking-tight text-[color:var(--air-fg)] sm:text-2xl">
                  {value}
                </p>
                <p className="mt-2 text-[13px] leading-snug text-[color:var(--air-fg-muted)]">{t(labelKey)}</p>
              </li>
            ))}
          </ul>
        </section>

        {featureBlocks.map(({ id, prefix, image, reverse }) => (
          <FeatureBlock
            key={id}
            id={id}
            eyebrow={t(`${prefix}.eyebrow` as TranslationKey)}
            title={accentedTitle(t, prefix)}
            body={t(`${prefix}.body` as TranslationKey)}
            points={[1, 2, 3, 4].map((n) => t(`${prefix}.point${n}` as TranslationKey))}
            image={image}
            imageAlt={t(`${prefix}.imageAlt` as TranslationKey)}
            reverse={reverse}
          />
        ))}

        <CapabilityGrid />

        <section className="py-24 sm:py-32">
          <Reveal className="relative z-30 mx-auto max-w-[1150px] px-5 text-center sm:px-8">
            <h2 className="mx-auto max-w-3xl text-[clamp(2rem,5vw,4rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[color:var(--air-fg)]">
              {accentedTitle(t, 'landing.closing')}
            </h2>
            <p className="mx-auto mt-7 max-w-lg text-base leading-relaxed text-[color:var(--air-fg-muted)]">
              {t('landing.closing.body')}
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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
          </Reveal>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
