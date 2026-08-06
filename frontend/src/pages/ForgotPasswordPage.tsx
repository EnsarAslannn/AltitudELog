import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthHero } from '../components/layout/AuthHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { apiErrorMessage } from '../lib/apiMessages'
import type { ApiError } from '../types/problemDetails'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await authService.forgotPassword({ email })

      setSubmitted(true)
    } catch (err) {
      setError(apiErrorMessage(err as ApiError, 'İstek gönderilemedi. Lütfen tekrar deneyin.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthHero
        image="/images/hangar.jpg"
        eyebrow="Account Recovery"
        title={
          <>
            Şifrenizi
            <br />
            sıfırlayın.
          </>
        }
        subtitle="Kayıtlı e-posta adresinize bir sıfırlama bağlantısı gönderelim."
        stat={{ value: '1h', label: 'Bağlantı 1 saat geçerlidir' }}
      />
      <div className="flex flex-1 items-center justify-center bg-surface px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="display mb-1 text-3xl text-on-surface sm:text-4xl">Şifremi Unuttum</h1>
          <p className="mb-6 text-sm text-on-surface-variant">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
          <Card>
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
                  <KeyRound className="h-6 w-6" />
                </span>
                <p className="text-sm text-on-surface-variant">
                  E-posta adresiniz kayıtlıysa bir sıfırlama bağlantısı gönderildi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && (
                  <p role="alert" className="text-sm text-error">
                    {error}
                  </p>
                )}
                <Input
                  label="E-posta"
                  name="email"
                  type="email"
                  icon={Mail}
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" icon={KeyRound} disabled={isSubmitting}>
                  {isSubmitting ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
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
