import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/**
 * The opening screen.
 *
 * It owns no video of its own any more — `PageBackdrop` runs one fixed clip
 * behind the whole document, and this section is simply the stretch of page
 * where that footage is left unscreened. All it contributes is a legibility
 * scrim and the copy.
 */
export function HeroSection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <section
      // data-nav-tone is what LandingNav's observer reads to recolour itself as
      // this section passes under the bar.
      data-nav-tone="dark"
      className="air-tone-dark relative flex min-h-[100svh] items-end"
    >
      <div className="air-hero-scrim absolute inset-0 z-10" />

      <div className="relative z-30 mx-auto w-full max-w-[1150px] px-5 pb-20 pt-32 sm:px-8 sm:pb-28">
        {/*
          lang="en" is load-bearing, not decoration. The document is lang="tr", and
          Turkish casing maps i → İ, so `text-transform: uppercase` rendered the
          English word "Flight" as "FLİGHT". Tagging the run as English restores
          the dotless capital I.
        */}
        <p lang="en" className="eyebrow mb-6 text-xs font-medium text-signal-blue sm:text-[13px]">
          Flight Ops · CRM · Logbook
        </p>

        <h1 className="max-w-3xl text-[clamp(2.5rem,7vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.025em] text-whiteout">
          Kokpitten yere,
          <br />
          <span className="air-cursive mr-2 text-[1.14em] text-[#9dbde4]">kesintisiz</span>{' '}
          kayıt.
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-whiteout/80">
          Uçuşlar, mürettebat atamaları ve CRM raporları tek bir operasyon kaydında toplanır.
          Her uçuşun METAR verisi arka planda otomatik olarak düşer.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink bg-haze px-6 text-sm font-medium text-ink transition-colors hover:bg-whiteout focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
            >
              Panele Git
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-ink bg-haze px-6 text-sm font-medium text-ink transition-colors hover:bg-whiteout focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
              >
                Hesap Oluştur
              </Link>
              <Link
                to="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-whiteout/70 px-6 text-sm font-medium text-whiteout transition-colors hover:border-whiteout hover:bg-whiteout/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue"
              >
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
