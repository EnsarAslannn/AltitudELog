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
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-slate-900 text-slate-50 shadow-sm shadow-slate-900/20 hover:bg-slate-800',
        variant === 'secondary' &&
          'border border-slate-300 bg-white text-slate-900 hover:border-slate-400 hover:bg-slate-50',
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
