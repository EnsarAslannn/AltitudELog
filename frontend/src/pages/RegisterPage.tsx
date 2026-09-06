import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BadgeCheck, CalendarDays, IdCard, Lock, Mail, ShieldCheck, Stethoscope, User, UserPlus } from 'lucide-react'
import { authService } from '../services/authService'
import { AuthSplitLayout } from '../components/layout/AuthSplitLayout'
import { AuthField, AuthSelect } from '../components/ui/AuthField'
import { Button } from '../components/ui/Button'
import { useT, type TranslationKey } from '../i18n'
import type { PilotRank, RegisterRequest } from '../types/auth'
import type { ApiError } from '../types/problemDetails'

const rankOptions: { value: PilotRank; labelKey: TranslationKey }[] = [
  { value: 'Trainee', labelKey: 'register.rank.trainee' },
  { value: 'FirstOfficer', labelKey: 'register.rank.firstOfficer' },
  { value: 'Captain', labelKey: 'register.rank.captain' },
  { value: 'ChiefPilot', labelKey: 'register.rank.chiefPilot' },
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
  const t = useT()

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
      setError(apiError.detail ?? apiError.title ?? t('register.failed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout
      eyebrow={t('register.eyebrow')}
      title={
        <>
          {t('register.titleLine1')}
          <br />
          {t('register.titleLine2')}
        </>
      }
      subtitle={t('register.subtitle')}
      formTitle={t('register.formTitle')}
      formSubtitle={t('register.formSubtitle')}
      footer={
        <>
          {t('register.hasAccount')}{' '}
          <Link
            to="/login"
            className="font-medium text-on-surface underline decoration-outline-variant underline-offset-4 transition-colors hover:decoration-on-surface"
          >
            {t('register.loginLink')}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} aria-busy={isSubmitting} className="flex flex-col gap-5">
        <AuthField
          label={t('register.name')}
          name="name"
          icon={BadgeCheck}
          value={form.name}
          onChange={updateField('name')}
          errors={fieldErrors?.Name ?? fieldErrors?.name}
          required
        />
        <AuthField
          label={t('register.licenseNumber')}
          name="licenseNumber"
          icon={IdCard}
          value={form.licenseNumber}
          onChange={updateField('licenseNumber')}
          errors={fieldErrors?.LicenseNumber ?? fieldErrors?.licenseNumber}
          required
        />
        <AuthField
          label={t('register.username')}
          name="username"
          icon={User}
          autoComplete="username"
          value={form.username}
          onChange={updateField('username')}
          errors={fieldErrors?.Username ?? fieldErrors?.username}
          required
        />
        <AuthField
          label={t('register.email')}
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
          label={t('register.password')}
          name="password"
          type="password"
          icon={Lock}
          autoComplete="new-password"
          value={form.password}
          onChange={updateField('password')}
          errors={fieldErrors?.Password ?? fieldErrors?.password}
          required
        />
        <AuthField
          label={t('register.licenseExpiry')}
          name="licenseExpiryDate"
          type="date"
          icon={CalendarDays}
          value={form.licenseExpiryDate ?? ''}
          onChange={updateField('licenseExpiryDate')}
        />
        <AuthField
          label={t('register.medicalExpiry')}
          name="medicalExpiryDate"
          type="date"
          icon={Stethoscope}
          value={form.medicalExpiryDate ?? ''}
          onChange={updateField('medicalExpiryDate')}
        />
        <div className="flex flex-col gap-2">
          <AuthSelect
            label={t('register.rank')}
            name="rank"
            value={form.rank}
            onChange={(e) => setForm((prev) => ({ ...prev, rank: e.target.value as PilotRank }))}
          >
            {rankOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </AuthSelect>
          <p className="flex gap-1.5 text-xs leading-relaxed text-on-surface-variant">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {t('register.rankNote')}
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
          {isSubmitting ? t('register.submitting') : t('register.submit')}
        </Button>
      </form>
    </AuthSplitLayout>
  )
}
