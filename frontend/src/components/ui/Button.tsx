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
        'inline-flex items-center justify-center gap-2 rounded-sm px-4 py-2.5 text-sm font-semibold tracking-tight transition-all',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-phosphor-500/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-phosphor-500 text-void-950 shadow-[0_0_0_1px_rgba(52,224,138,0.4),0_0_16px_-2px_rgba(52,224,138,0.5)] hover:bg-phosphor-400 hover:shadow-[0_0_0_1px_rgba(85,240,163,0.55),0_0_24px_-2px_rgba(85,240,163,0.7)] active:translate-y-px',
        variant === 'secondary' &&
          'border border-void-600 bg-void-900 text-mist-100 hover:border-phosphor-500/50 hover:bg-void-800 active:translate-y-px',
        variant === 'command' &&
          'bg-command-500 text-void-950 shadow-[0_0_0_1px_rgba(255,176,32,0.4),0_0_16px_-2px_rgba(255,176,32,0.5)] hover:bg-command-400 hover:shadow-[0_0_0_1px_rgba(255,194,71,0.55),0_0_24px_-2px_rgba(255,194,71,0.7)] active:translate-y-px focus-visible:ring-command-500/30',
        variant === 'ghost' && 'text-mist-300 hover:text-phosphor-400',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.25} />}
      {children}
    </button>
  )
}
