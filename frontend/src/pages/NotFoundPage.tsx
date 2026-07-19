import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
        <Compass className="h-8 w-8" />
      </span>
      <h1 className="text-2xl font-bold text-slate-900">404 - Sayfa Bulunamadı</h1>
      <Link to="/">
        <Button variant="secondary">Ana sayfaya dön</Button>
      </Link>
    </div>
  )
}
