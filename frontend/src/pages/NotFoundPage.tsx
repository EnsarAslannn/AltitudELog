import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-4 text-center">
      <img
        src="/images/tail.jpg"
        alt=""
        className="photo-rich absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 hero-scrim-center" />
      <div className="relative flex flex-col items-center gap-5 rise">
        <p className="data text-7xl font-semibold tabular-nums text-on-surface">404</p>
        <p className="eyebrow text-[11px] text-on-surface-variant">Off Course · Rota Dışı</p>
        <h1 className="display text-3xl leading-[1.15] text-on-surface sm:text-4xl">Sayfa Bulunamadı</h1>
        <p className="max-w-sm text-sm text-on-surface-variant">
          Aradığınız rota kayıtlarda yok. Ana panele geri dönün.
        </p>
        <Link to="/">
          <Button variant="primary">Ana sayfaya dön</Button>
        </Link>
      </div>
    </div>
  )
}
