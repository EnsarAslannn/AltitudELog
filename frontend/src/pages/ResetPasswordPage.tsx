import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Lock } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { AuthField } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
import type { ApiError } from '../types/problemDetails'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor.')
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
          ? 'Bağlantı geçersiz veya süresi dolmuş. Yeniden sıfırlama isteği gönderin.'
          : (apiError.detail ?? apiError.title ?? 'Şifre sıfırlanamadı.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthCardLayout
      title="Şifre Sıfırla"
      subtitle="Yeni şifrenizi girin. En az sekiz karakter olmalıdır."
      footer={
        <Link
          to="/login"
          className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
        >
          Girişe dön
        </Link>
      }
    >
      {token === '' ? (
        <p role="alert" className="text-sm text-error">
          Bağlantı geçersiz. Sıfırlama e-postasındaki bağlantıyı olduğu gibi kullanın veya{' '}
          <Link to="/forgot-password" className="font-medium underline underline-offset-4">
            yeni bir istek gönderin
          </Link>
          .
        </p>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
          <AuthField
            label="Yeni Şifre"
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
            label="Yeni Şifre (Tekrar)"
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
            {isSubmitting ? 'Kaydediliyor…' : 'Şifreyi Sıfırla'}
          </Button>
        </form>
      )}
    </AuthCardLayout>
  )
}
