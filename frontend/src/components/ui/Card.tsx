import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all',
        interactive && 'hover:-translate-y-0.5 hover:border-blue-600/30 hover:shadow-md',
        className,
      )}
      {...props}
    />
  )
}
