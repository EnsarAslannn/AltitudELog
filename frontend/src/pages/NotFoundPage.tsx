import { Link } from 'react-router-dom'
import { VideoBackdrop } from '../components/common/VideoBackdrop'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <VideoBackdrop />

      <div className="air-surface relative z-10 flex flex-col items-center gap-5 rounded-2xl px-8 py-10 shadow-[var(--shadow-panel-hover)] rise sm:px-12">
        <p className="data text-7xl font-semibold tabular-nums text-on-surface">404</p>
        <p className="eyebrow text-[11px] text-on-surface-variant">Off Course · Rota Dışı</p>
        <h1 className="display text-3xl leading-[1.15] text-on-surface sm:text-4xl">Sayfa Bulunamadı</h1>
        <p className="max-w-sm text-sm text-on-surface-variant">
          Aradığınız rota kayıtlarda yok. Ana panele geri dönün.
        </p>
        <Link to="/dashboard">
          <Button variant="primary">Ana sayfaya dön</Button>
        </Link>
      </div>
    </div>
  )
}
