import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">Yetkiniz Yok</h1>
      <p className="text-slate-500">Bu sayfayı görüntülemek için Captain rütbesine sahip olmanız gerekiyor.</p>
      <Link to="/">
        <Button variant="secondary">Ana sayfaya dön</Button>
      </Link>
    </div>
  )
}
