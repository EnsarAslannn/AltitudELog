import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { KeyRound, Lock } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthHero } from '../components/layout/AuthHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
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
    <div className="flex min-h-screen">
      <AuthHero
        image="/images/hero-approach.jpg"
        eyebrow="Account Recovery"
        title={
          <>
            Yeni şifrenizi
            <br />
            belirleyin.
          </>
        }
        subtitle="Güçlü bir şifre seçin ve hesabınıza tekrar erişim sağlayın."
        stat={{ value: '8+', label: 'Minimum karakter uzunluğu' }}
      />
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="display mb-1 text-3xl text-on-surface sm:text-4xl">Şifre Sıfırla</h1>
          <p className="mb-6 text-sm text-on-surface-variant">Yeni şifrenizi girin.</p>
          <Card>
            {token === '' ? (
              // Landing here without a token can only come from a malformed or truncated link.
              // Rendering the form anyway meant the user typed a password twice only to get a
              // generic 400 from the token's NotEmpty rule.
              <p role="alert" className="text-sm text-error">
                Bağlantı geçersiz. Sıfırlama e-postasındaki bağlantıyı olduğu gibi kullanın veya{' '}
                <Link to="/forgot-password" className="font-medium underline underline-offset-4">
                  yeni bir istek gönderin
                </Link>
                .
              </p>
            ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
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
              <Input
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
              <Button type="submit" icon={KeyRound} disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor…' : 'Şifreyi Sıfırla'}
              </Button>
            </form>
            )}
          </Card>
          <p className="mt-4 text-sm text-on-surface-variant">
            <Link to="/login" className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface">
              Girişe dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
