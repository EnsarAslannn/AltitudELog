import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, User } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AuthSplitLayout } from '../components/layout/AuthSplitLayout'
import { AuthField } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
import { useT } from '../i18n'
import type { ApiError } from '../types/problemDetails'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const t = useT()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await authService.login({ username, password })
      login(response, username)
      navigate(from, { replace: true })
    } catch (err) {
      setError((err as ApiError).detail ?? (err as ApiError).title ?? t('login.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      eyebrow={t('login.eyebrow')}
      title={
        <>
          {t('login.titleLine1')}
          <br />
          {t('login.titleLine2')}
        </>
      }
      subtitle={t('login.subtitle')}
      formTitle={t('login.formTitle')}
      formSubtitle={t('login.formSubtitle')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link
            to="/register"
            className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
          >
            {t('login.registerLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
        <AuthField
          label={t('login.username')}
          name="username"
          icon={User}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className="flex flex-col gap-2">
          <AuthField
            label={t('login.password')}
            name="password"
            type="password"
            icon={Lock}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Link
            to="/forgot-password"
            className="self-end text-xs font-medium text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors hover:text-on-surface hover:decoration-on-surface"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="brand"
          icon={LogIn}
          disabled={isSubmitting}
          className="mt-1 h-12 w-full rounded-[10px]"
        >
          {isSubmitting ? t('login.submitting') : t('login.formTitle')}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
