import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-4 text-center">
      <img
        src="/images/tail.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 hero-scrim" />
      <div className="relative flex flex-col items-center gap-5 rise">
        <p className="data text-6xl font-semibold tabular-nums text-on-primary">404</p>
        <p className="eyebrow text-[11px] text-on-primary/75">Off Course · Rota Dışı</p>
        <h1 className="text-3xl font-bold tracking-tight text-on-primary">Sayfa Bulunamadı</h1>
        <p className="max-w-sm text-sm text-on-primary/75">
          Aradığınız rota kayıtlarda yok. Ana panele geri dönün.
        </p>
        <Link to="/">
          <Button variant="command">Ana sayfaya dön</Button>
        </Link>
      </div>
    </div>
  )
}
