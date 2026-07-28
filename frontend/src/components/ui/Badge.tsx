import type { HTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'solid' | 'warning' | 'red' | 'green' | 'sky' | 'orange'
  icon?: LucideIcon
}

/*
 * `solid` is the one tone that carries brand significance rather than status: it marks
 * Captain / ChiefPilot rank and the PIC duty role. The design system is monochrome, so
 * that weight is expressed as a filled ink chip against outlined neutrals — never a hue.
 * Every other tone encodes status (certificate expiry, CRM severity) and keeps its
 * desaturated colour so safety data stays distinguishable.
 */
const toneClasses: Record<NonNullable<BadgeProps['tone']>, string> = {
  neutral: 'border-outline-variant bg-surface-container-low text-on-surface-variant',
  solid: 'border-primary bg-primary text-on-primary',
  warning: 'border-warning/30 bg-warning-container text-on-warning-container',
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
