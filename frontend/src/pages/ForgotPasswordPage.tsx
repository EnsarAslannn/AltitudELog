import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, Mail } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthHero } from '../components/layout/AuthHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await authService.forgotPassword({ email })
    } finally {
      // Always show the same outcome, whether or not the email is registered —
      // otherwise the response would leak which emails have an account.
      setIsSubmitting(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthHero
        image="/images/hero-approach.jpg"
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
      <div className="flex flex-1 items-center justify-center bg-[#f4f6fb] px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="mb-1 font-display text-display-lg font-bold tracking-tight text-[#0b1220]">Şifremi Unuttum</h1>
          <p className="mb-6 text-sm text-slate-500">E-posta adresinizi girin, sıfırlama bağlantısı gönderelim.</p>
          <Card>
            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#00205b]/5 text-[#00205b]">
                  <KeyRound className="h-6 w-6" />
                </span>
                <p className="text-sm text-slate-600">
                  E-posta adresiniz kayıtlıysa bir sıfırlama bağlantısı gönderildi.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
