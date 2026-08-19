import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { cn } from '../../lib/cn'
import { ghostCta, solidCta } from './ctas'

/**
 * The opening screen.
 *
 * It owns neither a video nor a scrim. `VideoBackdrop` runs one fixed clip behind
 * the whole document and this section simply sits on it, unmodified — as does
 * every section below. The copy is dark rather than white because the clip is a
 * bright sky: white type here was only ever readable because of the black
 * gradient that used to sit under it.
 */
export function HeroSection() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <section className="relative flex min-h-[100svh] items-end">
      <div className="relative z-30 mx-auto w-full max-w-[1150px] px-5 pb-20 pt-32 sm:px-8 sm:pb-28">
        {/*
          lang="en" is load-bearing, not decoration. The document is lang="tr", and
          Turkish casing maps i → İ, so `text-transform: uppercase` rendered the
          English word "Flight" as "FLİGHT". Tagging the run as English restores
          the dotless capital I.
        */}
        <p lang="en" className="eyebrow mb-6 text-xs font-medium text-[color:var(--air-accent)] sm:text-[13px]">
          Flight Ops · CRM · Logbook
        </p>

        <h1 className="max-w-3xl text-[clamp(2.5rem,7vw,5.25rem)] font-medium leading-[1.02] tracking-[-0.025em] text-[color:var(--air-fg)]">
          Kokpitten yere,
          <br />
          <span className="air-cursive mr-2 text-[1.14em] text-[color:var(--air-accent)]">kesintisiz</span>{' '}
          kayıt.
        </h1>

        <p className="mt-7 max-w-xl text-base leading-relaxed text-[color:var(--air-fg-muted)]">
          Uçuşlar, mürettebat atamaları ve CRM raporları tek bir operasyon kaydında toplanır.
          Her uçuşun METAR verisi arka planda otomatik olarak düşer.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          {isAuthenticated ? (
            <Link to="/dashboard" className={cn('inline-flex', solidCta)}>
              Panele Git
            </Link>
          ) : (
            <>
              <Link to="/register" className={cn('inline-flex', solidCta)}>
                Hesap Oluştur
              </Link>
              <Link to="/login" className={cn('inline-flex', ghostCta)}>
                Giriş Yap
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
