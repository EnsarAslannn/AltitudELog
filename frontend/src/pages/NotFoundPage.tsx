import { Link } from 'react-router-dom'
import { VideoBackdrop } from '../components/common/VideoBackdrop'
import { Button } from '../components/ui/Button'
import { LanguageToggle } from '../components/ui/LanguageToggle'
import { useT } from '../i18n'

export function NotFoundPage() {
  const t = useT()

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <VideoBackdrop />

      <LanguageToggle variant="air" className="fixed left-5 top-5 z-20 sm:left-8" />

      <div className="air-surface relative z-10 flex flex-col items-center gap-5 rounded-2xl px-8 py-10 shadow-[var(--shadow-panel-hover)] rise sm:px-12">
        <p className="data text-7xl font-semibold tabular-nums text-on-surface">404</p>
        <p className="eyebrow text-[11px] text-on-surface-variant">{t('notFound.eyebrow')}</p>
        <h1 className="display text-3xl leading-[1.15] text-on-surface sm:text-4xl">{t('notFound.title')}</h1>
        <p className="max-w-sm text-sm text-on-surface-variant">{t('notFound.body')}</p>
        <Link to="/dashboard">
          <Button variant="primary">{t('common.backToHome')}</Button>
        </Link>
      </div>
    </div>
  )
}
