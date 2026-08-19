import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

const labelClass = 'text-[11px] font-medium uppercase tracking-[0.16em] text-on-surface-variant'

const controlClass =
  'h-12 w-full rounded-[10px] border border-outline-variant/50 bg-surface-container-low px-3.5 text-sm text-on-surface outline-none transition-[background-color,border-color,box-shadow] placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest focus:ring-4 focus:ring-primary/12'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  errors?: string[]
  icon?: LucideIcon
}

export function AuthField({ label, errors, icon: Icon, id, className, ...props }: AuthFieldProps) {
  const inputId = id ?? props.name
  const hasError = !!errors?.length
  const errorId = `${inputId}-error`

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        )}
        <input
          id={inputId}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={cn(controlClass, Icon && 'pl-10', hasError && 'border-error', className)}
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

interface AuthSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function AuthSelect({ label, id, className, children, ...props }: AuthSelectProps) {
  const selectId = id ?? props.name

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <select id={selectId} className={cn(controlClass, 'appearance-none pr-10', className)} {...props}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
      </div>
    </div>
  )
}
