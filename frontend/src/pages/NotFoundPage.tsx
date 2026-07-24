import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-void-950 px-4 text-center scanlines">
      <img
        src="/images/tail.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover hero-photo"
      />
      <div className="absolute inset-0 hero-scrim" />
      <div className="relative flex flex-col items-center gap-5 rise">
        <p className="data text-6xl font-semibold tabular-nums text-mist-100">404</p>
        <p className="eyebrow text-[11px] text-mist-300">Off Course · Rota Dışı</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-mist-100">Sayfa Bulunamadı</h1>
        <p className="max-w-sm text-sm text-mist-300">
          Aradığınız rota kayıtlarda yok. Ana panele geri dönün.
        </p>
        <Link to="/">
          <Button variant="command">Ana sayfaya dön</Button>
        </Link>
      </div>
    </div>
  )
}
