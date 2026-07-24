import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-sm border border-void-700 bg-void-900 p-6 shadow-[var(--shadow-panel)] transition-all',
        interactive &&
          'hover:-translate-y-0.5 hover:border-phosphor-500/40 hover:shadow-[var(--shadow-panel-hover)]',
        className,
      )}
      {...props}
    />
  )
}
