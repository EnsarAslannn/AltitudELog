import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Eyebrow'

export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-sm bg-alert-500/10 text-alert-400">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <Eyebrow rule={false} className="justify-center">
        Access Restricted · 403
      </Eyebrow>
      <h1 className="font-display text-display-lg font-bold tracking-tight text-mist-100">Yetkiniz Yok</h1>
      <p className="max-w-sm text-mist-300">
        Bu sayfayı görüntülemek için Captain rütbesine sahip olmanız gerekiyor.
      </p>
      <Link to="/">
        <Button variant="secondary">Ana sayfaya dön</Button>
      </Link>
    </div>
  )
}
