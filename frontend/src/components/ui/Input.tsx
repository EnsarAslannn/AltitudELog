import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errors?: string[]
  icon?: LucideIcon
}

export function Input({ label, errors, icon: Icon, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name
  const hasError = !!errors?.length
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="eyebrow text-[11px] text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        )}
        <input
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(
            'w-full rounded border bg-surface-container-lowest px-3 py-2.5 text-sm text-on-surface outline-none placeholder:text-outline transition-colors',
            'focus:border-primary focus:ring-4 focus:ring-primary/15',
            Icon && 'pl-9',
            hasError ? 'border-error' : 'border-outline-variant',
            className,
          )}
          {...props}
        />
      </div>
      {hasError && (
        <p id={errorId} className="text-xs text-error">
          {errors!.join(', ')}
        </p>
      )}
    </div>
  )
}
