import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  glass?: boolean
}

export function Card({ interactive, glass, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-all',
        glass
          ? 'glass-panel'
          : 'border border-outline-variant/40 bg-surface-container-lowest shadow-[var(--shadow-panel)]',
        interactive &&
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-panel-hover)]',
        className,
      )}
      {...props}
    />
  )
}
