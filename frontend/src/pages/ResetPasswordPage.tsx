import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Lock } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { AuthField } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
import { useT } from '../i18n'
import type { ApiError } from '../types/problemDetails'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const t = useT()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.mismatch'))
      return
    }

    setIsSubmitting(true)
    try {
      await authService.resetPassword({ token, newPassword })
      navigate('/login')
    } catch (err) {
      const apiError = err as ApiError
      setError(
        apiError.status === 401
          ? t('resetPassword.expired')
          : (apiError.detail ?? apiError.title ?? t('resetPassword.failed')),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardLayout
      title={t('resetPassword.title')}
      subtitle={t('resetPassword.subtitle')}
      footer={
        <Link
          to="/login"
          className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
        >
          {t('resetPassword.backToLogin')}
        </Link>
      }
    >
      {token === '' ? (
        <p role="alert" className="text-sm text-error">
          {t('resetPassword.invalidLinkLead')}{' '}
          <Link to="/forgot-password" className="font-medium underline underline-offset-4">
            {t('resetPassword.invalidLinkAction')}
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
          <AuthField
            label={t('resetPassword.newPassword')}
            name="newPassword"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
          <AuthField
            label={t('resetPassword.confirmPassword')}
            name="confirmPassword"
            type="password"
            icon={Lock}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button
            type="submit"
            variant="brand"
            icon={KeyRound}
            disabled={isSubmitting}
            className="mt-1 h-12 w-full rounded-[10px]"
          >
            {isSubmitting ? t('common.saving') : t('resetPassword.submit')}
          </Button>
        </form>
      )}
    </AuthCardLayout>
  )
}
