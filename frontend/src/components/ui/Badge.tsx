import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'sky'
  icon?: LucideIcon
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-void-600 bg-void-800 text-mist-300',
  blue: 'border-phosphor-500/40 bg-phosphor-500/10 text-phosphor-400',
  amber: 'border-command-500/40 bg-command-500/10 text-command-400',
  red: 'border-alert-500/40 bg-alert-500/10 text-alert-400',
  green: 'border-phosphor-500/40 bg-phosphor-500/10 text-phosphor-400',
  sky: 'border-phosphor-300/40 bg-phosphor-300/10 text-phosphor-300',
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
