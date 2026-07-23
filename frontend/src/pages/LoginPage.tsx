import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, User } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AuthHero } from '../components/layout/AuthHero'
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
    <div className="flex min-h-screen">
      <AuthHero
        image="/images/hero-approach.jpg"
        eyebrow="Flight Operations Console"
        title={
          <>
            Uçuş kayıtlarınız,
            <br />
            tek kokpitte.
          </>
        }
        subtitle="Mürettebat atamaları, CRM raporları ve METAR akışı — uçuş ekipleri için tasarlanmış tek panel."
        stat={{ value: 'METAR', label: 'Her uçuşta otomatik hava durumu' }}
      />
      <div className="flex flex-1 items-center justify-center bg-[#f4f6fb] px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-[#0b1220]">Giriş Yap</h1>
          <p className="mb-6 text-sm text-slate-500">Hesabınıza erişmek için bilgilerinizi girin.</p>
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                  className="self-end text-xs font-medium text-[#00205b] hover:underline"
                >
                  Şifremi unuttum
                </Link>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" icon={LogIn} disabled={isSubmitting}>
                {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              </Button>
            </form>
          </Card>
          <p className="mt-4 text-sm text-slate-500">
            Hesabın yok mu?{' '}
            <Link to="/register" className="font-medium text-[#00205b] hover:underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
