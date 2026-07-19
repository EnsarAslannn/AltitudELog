import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'blue' | 'amber' | 'red' | 'green' | 'sky'
  icon?: LucideIcon
}

const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-slate-300 bg-slate-200 text-slate-900',
  blue: 'border-blue-600/40 bg-blue-600/10 text-blue-700',
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
