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
      <div className="flex flex-1 items-center justify-center bg-[#f4f6fb] px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="mb-1 font-display text-display-lg font-bold tracking-tight text-[#0b1220]">Şifre Sıfırla</h1>
          <p className="mb-6 text-sm text-slate-500">Yeni şifrenizi girin.</p>
          <Card>
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" icon={KeyRound} disabled={isSubmitting}>
                {isSubmitting ? 'Kaydediliyor…' : 'Şifreyi Sıfırla'}
              </Button>
            </form>
          </Card>
          <p className="mt-4 text-sm text-slate-500">
            <Link to="/login" className="font-medium text-[#00205b] hover:underline">
              Girişe dön
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
