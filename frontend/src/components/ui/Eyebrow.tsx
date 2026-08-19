import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  rule?: boolean
  tone?: 'ink' | 'soft'
}

export function Eyebrow({ rule = true, tone = 'ink', className, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        tone === 'ink' ? 'text-twilight-blue' : 'text-on-surface-variant',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 shrink-0 rotate-45',
          tone === 'ink' ? 'bg-twilight-blue' : 'bg-on-surface-variant',
        )}
        aria-hidden
      />
      <span className="eyebrow text-[11px] font-semibold">{children}</span>
      {rule && (
        <span
          className={cn('h-px flex-1', tone === 'ink' ? 'bg-outline-variant' : 'bg-outline-variant/70')}
          aria-hidden
        />
      )}
    </div>
  )
}
