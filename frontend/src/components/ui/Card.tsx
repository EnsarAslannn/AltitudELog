import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

export function Card({ interactive, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(0,18,53,0.04),0_8px_24px_-12px_rgba(0,18,53,0.12)] transition-all',
        interactive &&
          'hover:-translate-y-0.5 hover:border-[#00205b]/25 hover:shadow-[0_1px_2px_rgba(0,18,53,0.06),0_16px_40px_-16px_rgba(0,18,53,0.25)]',
        className,
      )}
      {...props}
    />
  )
}
