import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'glass rounded-lg p-6 shadow-lg shadow-black/20 transition-all',
        interactive && 'hover:-translate-y-0.5 hover:border-blue-600/40 hover:shadow-blue-600/10',
        className,
      )}
      {...props}
    />
  )
}
