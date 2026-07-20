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
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          id={inputId}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition-colors focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10',
            Icon && 'pl-9',
            hasError ? 'border-red-500' : 'border-slate-300',
            className,
          )}
          {...props}
        />
      </div>
      {hasError && <p className="text-xs text-red-600">{errors!.join(', ')}</p>}
    </div>
  )
}
