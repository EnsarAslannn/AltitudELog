import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: LucideIcon
}

export function Button({ variant = 'primary', icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-semibold tracking-tight transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-primary text-on-primary shadow-[var(--shadow-panel)] hover:bg-primary-container hover:shadow-[var(--shadow-panel-hover)] active:translate-y-px',
        variant === 'secondary' &&
          'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary/50 hover:bg-surface-container-low active:translate-y-px',
        variant === 'ghost' && 'text-on-surface-variant hover:text-primary',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.25} />}
      {children}
    </button>
  )
}
