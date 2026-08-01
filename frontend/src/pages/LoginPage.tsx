import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, User } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { ScrollExpandHero } from '../components/ui/ScrollExpandHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import type { ApiError } from '../types/problemDetails'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

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
    <ScrollExpandHero
      mediaType="image"
      mediaSrc="/images/taxi-dusk.jpg"
      bgImageSrc="/images/hero-approach.jpg"
      date="Flight Operations Console"
      title="Uçuş Kayıtlarınız Kokpitte"
      scrollToExpand="Kaydırarak devam edin"
    >
      <div className="w-full max-w-sm rise">
        <h1 className="display mb-1 text-3xl text-on-surface sm:text-4xl">Giriş Yap</h1>
        <p className="mb-6 text-sm text-on-surface-variant">Hesabınıza erişmek için bilgilerinizi girin.</p>
        <Card>
          <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-4">
            <Input
              label="Kullanıcı Adı"
              name="username"
              icon={User}
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <div className="flex flex-col gap-1.5">
              <Input
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
            <Button type="submit" icon={LogIn} disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-sm text-on-surface-variant">
          Hesabın yok mu?{' '}
          <Link to="/register" className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface">
            Kayıt ol
          </Link>
        </p>
      </div>
    </ScrollExpandHero>
  )
}
