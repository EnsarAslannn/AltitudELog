import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-navy-900/8 bg-white p-6 shadow-[var(--shadow-card)] transition-all',
        interactive &&
          'hover:-translate-y-0.5 hover:border-navy-900/25 hover:shadow-[var(--shadow-card-hover)]',
        className,
      )}
      {...props}
    />
  )
}
