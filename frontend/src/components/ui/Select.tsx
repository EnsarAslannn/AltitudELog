import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
}

export function Select({ label, id, className, children, ...props }: SelectProps) {
  const selectId = id ?? props.name

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="eyebrow text-[11px] text-mist-300">
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          className={cn(
            'w-full appearance-none rounded-sm border border-void-600 bg-void-900 px-3 py-2.5 pr-9 text-sm text-mist-100 outline-none transition-colors focus:border-phosphor-500 focus:ring-4 focus:ring-phosphor-500/15',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
      </div>
    </div>
  )
}
