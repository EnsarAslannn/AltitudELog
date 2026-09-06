import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Eyebrow } from '../components/ui/Eyebrow'
import { useT } from '../i18n'

export function UnauthorizedPage() {
  const t = useT()

  return (
    <div className="flex flex-col items-center gap-5 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded bg-error/10 text-error">
        <ShieldAlert className="h-8 w-8" />
      </span>
      <Eyebrow rule={false} className="justify-center">
        {t('unauthorized.eyebrow')}
      </Eyebrow>
      <h1 className="display text-3xl text-on-surface sm:text-4xl">{t('unauthorized.title')}</h1>
      <p className="max-w-sm text-on-surface-variant">{t('unauthorized.body')}</p>
      <Link to="/dashboard">
        <Button variant="secondary">{t('common.backToHome')}</Button>
      </Link>
    </div>
  )
}
