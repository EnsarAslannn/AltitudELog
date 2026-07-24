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

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="eyebrow text-[11px] text-mist-300">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-sm border bg-void-900 px-3 py-2.5 text-sm text-mist-100 outline-none placeholder:text-mist-500 transition-colors',
            'focus:border-phosphor-500 focus:ring-4 focus:ring-phosphor-500/15',
            Icon && 'pl-9',
            hasError ? 'border-alert-500' : 'border-void-600',
            className,
          )}
          {...props}
        />
      </div>
      {hasError && <p className="text-xs text-alert-400">{errors!.join(', ')}</p>}
    </div>
  )
}
