import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'sky' | 'orange'
  icon?: LucideIcon
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  blue: 'border-primary/30 bg-primary/8 text-primary',
  amber: 'border-command/30 bg-command-container text-on-command-container',
  red: 'border-error/30 bg-error/8 text-error',
  green: 'border-success/30 bg-success-container text-on-success-container',
  sky: 'border-secondary/30 bg-secondary-container text-on-secondary-container',
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
