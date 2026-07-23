import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, CalendarDays, IdCard, Lock, Mail, ShieldCheck, Stethoscope, User, UserPlus } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthHero } from '../components/layout/AuthHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import type { PilotRank, RegisterRequest } from '../types/auth'
import type { ApiError } from '../types/problemDetails'

const rankOptions: { value: PilotRank; label: string }[] = [
  { value: 'Trainee', label: 'Trainee — Stajyer' },
  { value: 'FirstOfficer', label: 'First Officer — İkinci Pilot' },
  { value: 'Captain', label: 'Captain — Kaptan Pilot' },
  { value: 'ChiefPilot', label: 'Chief Pilot — Baş Pilot' },
]

export function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest>({
    username: '',
    password: '',
    name: '',
    licenseNumber: '',
    email: '',
    rank: 'Trainee',
    licenseExpiryDate: '',
    medicalExpiryDate: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()

  function updateField(
    field: 'username' | 'password' | 'name' | 'licenseNumber' | 'email' | 'licenseExpiryDate' | 'medicalExpiryDate',
  ) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setFieldErrors(null)
    setIsSubmitting(true)

    try {
      await authService.register({
        ...form,
        licenseExpiryDate: form.licenseExpiryDate || null,
        medicalExpiryDate: form.medicalExpiryDate || null,
      })
      navigate('/login')
    } catch (err) {
      const apiError = err as ApiError
      setFieldErrors(apiError.fieldErrors)
      setError(apiError.detail ?? apiError.title ?? 'Kayıt başarısız.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <AuthHero
        image="/images/flightdeck.jpg"
        eyebrow="New Crew Onboarding"
        title={
          <>
            Ekibe katılın,
            <br />
            göreve hazırlanın.
          </>
        }
        subtitle="Rütbenizi seçin ve hesabınızı oluşturun. Captain rütbesi uçuş ve mürettebat kaydı oluşturma yetkisi verir."
        stat={{ value: 'CPT', label: 'Captain: uçuş & mürettebat yetkisi' }}
      />
      <div className="flex flex-1 items-center justify-center bg-[#f4f6fb] px-4 py-10">
        <div className="w-full max-w-sm rise">
          <h1 className="mb-1 font-display text-2xl font-bold tracking-tight text-[#0b1220]">Pilot Kaydı</h1>
          <p className="mb-6 text-sm text-slate-500">Rütbenizi seçerek hesabınızı oluşturun.</p>
          <Card>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Input
                label="Ad Soyad"
                name="name"
                icon={BadgeCheck}
                value={form.name}
                onChange={updateField('name')}
                errors={fieldErrors?.Name ?? fieldErrors?.name}
                required
              />
              <Input
                label="Lisans Numarası"
                name="licenseNumber"
                icon={IdCard}
                value={form.licenseNumber}
                onChange={updateField('licenseNumber')}
                errors={fieldErrors?.LicenseNumber ?? fieldErrors?.licenseNumber}
                required
              />
              <Input
                label="Kullanıcı Adı"
                name="username"
                icon={User}
                autoComplete="username"
                value={form.username}
                onChange={updateField('username')}
                errors={fieldErrors?.Username ?? fieldErrors?.username}
                required
              />
              <Input
                label="E-posta"
                name="email"
                type="email"
                icon={Mail}
                autoComplete="email"
                value={form.email}
                onChange={updateField('email')}
                errors={fieldErrors?.Email ?? fieldErrors?.email}
                required
              />
              <Input
                label="Şifre"
                name="password"
                type="password"
                icon={Lock}
                autoComplete="new-password"
                value={form.password}
                onChange={updateField('password')}
                errors={fieldErrors?.Password ?? fieldErrors?.password}
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Lisans Bitiş (opsiyonel)"
                  name="licenseExpiryDate"
                  type="date"
                  icon={CalendarDays}
                  value={form.licenseExpiryDate ?? ''}
                  onChange={updateField('licenseExpiryDate')}
                />
                <Input
                  label="Medical Bitiş (opsiyonel)"
                  name="medicalExpiryDate"
                  type="date"
                  icon={Stethoscope}
                  value={form.medicalExpiryDate ?? ''}
                  onChange={updateField('medicalExpiryDate')}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Select
                  label="Rütbe"
                  name="rank"
                  value={form.rank}
                  onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value as PilotRank }))}
                >
                  {rankOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#f59e0b]" />
                  Captain seçerseniz uçuş ve mürettebat oluşturabilirsiniz.
                </p>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" icon={UserPlus} disabled={isSubmitting}>
                {isSubmitting ? 'Kayıt olunuyor…' : 'Kayıt Ol'}
              </Button>
            </form>
          </Card>
          <p className="mt-4 text-sm text-slate-500">
            Zaten hesabın var mı?{' '}
            <Link to="/login" className="font-medium text-[#00205b] hover:underline">
              Giriş yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
