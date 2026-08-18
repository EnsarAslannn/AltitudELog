import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Eyebrow'

export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded bg-error/10 text-error">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <Eyebrow rule={false} className="justify-center">
        Access Restricted · 403
      </Eyebrow>
      <h1 className="display text-3xl text-on-surface sm:text-4xl">Yetkiniz Yok</h1>
      <p className="max-w-sm text-on-surface-variant">
        Bu sayfayı görüntülemek için Captain veya ChiefPilot rütbesine sahip olmanız gerekiyor.
      </p>
      <Link to="/dashboard">
        <Button variant="secondary">Ana sayfaya dön</Button>
      </Link>
    </div>
  )
}
