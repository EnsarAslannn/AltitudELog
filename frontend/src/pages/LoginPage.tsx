import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, User } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AuthSplitLayout } from '../components/layout/AuthSplitLayout'
import { AuthField } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
import type { ApiError } from '../types/problemDetails'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
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
      setError((err as ApiError).detail ?? (err as ApiError).title ?? 'Giriş başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      eyebrow="Flight Operations Console"
      title={
        <>
          Uçuş kayıtlarınız
          <br />
          kokpitte başlar.
        </>
      }
      subtitle="Uçuşlar, mürettebat atamaları ve CRM raporları için operasyon defterinize giriş yapın."
      formTitle="Giriş Yap"
      formSubtitle="Hesabınıza erişmek için bilgilerinizi girin."
      footer={
        <>
          Hesabın yok mu?{' '}
          <Link
            to="/register"
            className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
          >
            Kayıt ol
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
        <AuthField
          label="Kullanıcı Adı"
          name="username"
          icon={User}
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <div className="flex flex-col gap-2">
          <AuthField
            label="Şifre"
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
            Şifremi unuttum
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
          {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
