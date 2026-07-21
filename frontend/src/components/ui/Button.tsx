import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'command' | 'ghost'
  icon?: LucideIcon
}

export function Button({ variant = 'primary', icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold tracking-tight transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#00205b]/25',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-[#00205b] text-white shadow-sm shadow-[#00205b]/25 hover:bg-[#06214f] active:translate-y-px',
        variant === 'secondary' &&
          'border border-slate-300 bg-white text-[#0b1220] hover:border-[#00205b]/40 hover:bg-slate-50',
        variant === 'command' &&
          'bg-[#f59e0b] text-[#3a2500] shadow-sm shadow-amber-500/30 hover:bg-[#e8940a] active:translate-y-px focus-visible:ring-amber-500/30',
        variant === 'ghost' && 'text-slate-500 hover:text-[#00205b]',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.25} />}
      {children}
    </button>
  )
}
