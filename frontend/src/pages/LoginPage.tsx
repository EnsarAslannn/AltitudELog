import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, Lock, User } from 'lucide-react'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import { AuthHero } from '../components/layout/AuthHero'
import { Button } from '../components/ui/Button'
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
      <AuthHero />
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-2xl font-bold text-slate-900">Giriş Yap</h1>
          <p className="mb-6 text-sm text-slate-500">Hesabınıza erişmek için bilgilerinizi girin.</p>
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" icon={LogIn} disabled={isSubmitting}>
              {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-500">
            Hesabın yok mu?{' '}
            <Link to="/register" className="font-medium text-blue-500 hover:underline">
              Kayıt ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
