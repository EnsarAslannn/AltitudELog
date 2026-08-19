import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'solid' | 'warning' | 'red' | 'green' | 'sky' | 'orange'
  icon?: LucideIcon
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  solid: 'border-primary bg-primary text-on-primary',
  warning: 'border-yellow-600/25 bg-yellow-500/20 text-yellow-800',
  red: 'border-error/30 bg-error-container text-on-error-container',
  green: 'border-success/30 bg-success-container text-on-success-container',
  sky: 'border-outline-variant bg-secondary-container text-on-secondary-container',
  orange: 'border-high/30 bg-high-container text-on-high-container',
}

export function Badge({ tone = 'neutral', icon: Icon, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={2.5} />}
      {children}
    </span>
  )
}
