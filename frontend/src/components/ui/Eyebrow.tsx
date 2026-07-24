import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface EyebrowProps extends HTMLAttributes<HTMLDivElement> {
  /** Draw a hairline rule after the label. */
  rule?: boolean
  tone?: 'navy' | 'light'
}

export function Eyebrow({ rule = true, tone = 'navy', className, children, ...props }: EyebrowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3',
        tone === 'navy' ? 'text-phosphor-400' : 'text-white/70',
        className,
      )}
      {...props}
    >
      <span className="h-1.5 w-1.5 shrink-0 rotate-45 bg-command-500" aria-hidden />
      <span className="eyebrow text-[11px] font-medium">{children}</span>
      {rule && (
        <span
          className={cn(
            'h-px flex-1',
            tone === 'navy' ? 'bg-void-600' : 'bg-white/20',
          )}
          aria-hidden
        />
      )}
    </div>
  )
}
