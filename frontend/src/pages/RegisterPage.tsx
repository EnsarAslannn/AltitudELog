import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, CalendarDays, IdCard, Lock, Mail, ShieldCheck, Stethoscope, User, UserPlus } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthSplitLayout } from '../components/layout/AuthSplitLayout'
import { AuthField, AuthSelect } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
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
    <AuthSplitLayout
      eyebrow="New Crew Onboarding"
      title={
        <>
          Ekibe katılın,
          <br />
          göreve hazırlanın.
        </>
      }
      subtitle="Rütbenizi seçin ve hesabınızı oluşturun. Captain rütbesi uçuş ve mürettebat kaydı oluşturma yetkisi verir."
      formTitle="Pilot Kaydı"
      formSubtitle="Rütbenizi seçerek hesabınızı oluşturun."
      footer={
        <>
          Zaten hesabın var mı?{' '}
          <Link
            to="/login"
            className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
          >
            Giriş yap
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
        <AuthField
          label="Ad Soyad"
          name="name"
          icon={BadgeCheck}
          value={form.name}
          onChange={updateField('name')}
          errors={fieldErrors?.Name ?? fieldErrors?.name}
          required
        />
        <AuthField
          label="Lisans Numarası"
          name="licenseNumber"
          icon={IdCard}
          value={form.licenseNumber}
          onChange={updateField('licenseNumber')}
          errors={fieldErrors?.LicenseNumber ?? fieldErrors?.licenseNumber}
          required
        />
        <AuthField
          label="Kullanıcı Adı"
          name="username"
          icon={User}
          autoComplete="username"
          value={form.username}
          onChange={updateField('username')}
          errors={fieldErrors?.Username ?? fieldErrors?.username}
          required
        />
        <AuthField
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
        <AuthField
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
        {/* One per row rather than a two-up grid: the panel is a quarter of the
            screen, and a side-by-side date pair clips its own labels there. */}
        <AuthField
          label="Lisans Bitiş (opsiyonel)"
          name="licenseExpiryDate"
          type="date"
          icon={CalendarDays}
          value={form.licenseExpiryDate ?? ''}
          onChange={updateField('licenseExpiryDate')}
        />
        <AuthField
          label="Medical Bitiş (opsiyonel)"
          name="medicalExpiryDate"
          type="date"
          icon={Stethoscope}
          value={form.medicalExpiryDate ?? ''}
          onChange={updateField('medicalExpiryDate')}
        />
        <div className="flex flex-col gap-2">
          <AuthSelect
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
          </AuthSelect>
          <p className="flex gap-1.5 text-xs leading-relaxed text-on-surface-variant">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Captain seçerseniz uçuş ve mürettebat oluşturabilirsiniz. Bu bir demo özelliğidir — gerçek bir
            sistemde rütbe ataması yönetici onayına tabi olur.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button
          type="submit"
          variant="brand"
          icon={UserPlus}
          disabled={isSubmitting}
          className="mt-1 h-12 w-full rounded-[10px]"
        >
          {isSubmitting ? 'Kayıt olunuyor…' : 'Kayıt Ol'}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
