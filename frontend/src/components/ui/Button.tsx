import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  icon?: LucideIcon
}

export function Button({ variant = 'primary', icon: Icon, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'glow-blue bg-blue-600 text-slate-50 hover:bg-blue-500 hover:-translate-y-px',
        variant === 'secondary' &&
          'border border-slate-300 bg-slate-200 text-slate-900 hover:border-slate-400 hover:bg-slate-300',
        variant === 'ghost' && 'text-slate-500 hover:text-slate-900',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={2.25} />}
      {children}
    </button>
  )
}
