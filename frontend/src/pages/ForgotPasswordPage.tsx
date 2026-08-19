import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthCardLayout } from '../components/layout/AuthCardLayout'
import { AuthField } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
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
    <AuthCardLayout
      title="Şifremi Unuttum"
      subtitle="E-posta adresinizi girin, sıfırlama bağlantısı gönderelim. Bağlantı bir saat geçerlidir."
      footer={
        <Link
          to="/login"
          className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
        >
          Girişe dön
        </Link>
      }
    >
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-high text-on-surface">
            <KeyRound className="h-6 w-6" />
          </span>
          <p className="text-sm text-on-surface-variant">
            E-posta adresiniz kayıtlıysa bir sıfırlama bağlantısı gönderildi.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <AuthField
            label="E-posta"
            name="email"
            type="email"
            icon={Mail}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button
            type="submit"
            variant="brand"
            icon={KeyRound}
            disabled={isSubmitting}
            className="mt-1 h-12 w-full rounded-[10px]"
          >
            {isSubmitting ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
          </Button>
        </form>
      )}
    </AuthCardLayout>
  )
}
