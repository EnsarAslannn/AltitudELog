import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'sky'
  icon?: LucideIcon
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-slate-300 bg-slate-100 text-slate-700',
  blue: 'border-navy-900/25 bg-navy-900/8 text-navy-900',
  amber: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  red: 'border-red-500/40 bg-red-500/10 text-red-700',
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700',
  sky: 'border-sky-500/40 bg-sky-500/10 text-sky-700',
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
