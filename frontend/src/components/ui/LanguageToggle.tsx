import { Fragment } from 'react'
import { cn } from '../../lib/cn'
import { LANGUAGES, useLanguageStore, useT, type Language } from '../../i18n'

/**
 * `air` renders on the video ground (landing page, auth panels) against the `--air-*`
 * palette; `surface` renders on the light application chrome. Same control, two grounds —
 * see "Frontend — the video ground" in CLAUDE.md.
 */
type LanguageToggleVariant = 'air' | 'surface' | 'onDark'

interface LanguageToggleProps {
  variant?: LanguageToggleVariant
  className?: string
}

const labels: Record<Language, string> = { tr: 'TR', en: 'EN' }

const nameKey = { tr: 'common.language.tr', en: 'common.language.en' } as const

const variantClasses: Record<
  LanguageToggleVariant,
  { active: string; inactive: string; separator: string; outline: string }
> = {
  air: {
    active: 'text-[color:var(--air-fg)]',
    inactive: 'text-[color:var(--air-fg-muted)] hover:text-[color:var(--air-fg)]',
    separator: 'text-[color:var(--air-fg-muted)]/60',
    outline: 'focus-visible:outline-signal-blue',
  },
  surface: {
    active: 'text-on-surface',
    inactive: 'text-on-surface-variant hover:text-on-surface',
    separator: 'text-outline/60',
    outline: 'focus-visible:outline-primary',
  },
  onDark: {
    active: 'text-whiteout',
    inactive: 'text-whiteout/65 hover:text-whiteout',
    separator: 'text-whiteout/45',
    outline: 'focus-visible:outline-whiteout',
  },
}

export function LanguageToggle({ variant = 'surface', className }: LanguageToggleProps) {
  const language = useLanguageStore((state) => state.language)
  const setLanguage = useLanguageStore((state) => state.setLanguage)
  const t = useT()
  const tone = variantClasses[variant]

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={cn('flex items-center gap-0.5', className)}
    >
      {LANGUAGES.map((code, index) => (
        <Fragment key={code}>
          {index > 0 && (
            <span aria-hidden="true" className={cn('select-none text-xs', tone.separator)}>
              |
            </span>
          )}
          <button
            type="button"
            lang={code}
            onClick={() => setLanguage(code)}
            aria-pressed={language === code}
            title={t(nameKey[code])}
            className={cn(
              'flex min-h-9 items-center rounded px-1.5 text-xs font-semibold tracking-[0.08em] transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              tone.outline,
              language === code ? tone.active : tone.inactive,
            )}
          >
            {labels[code]}
          </button>
        </Fragment>
      ))}
    </div>
  )
}
