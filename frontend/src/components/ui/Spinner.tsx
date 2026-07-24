import { cn } from '../../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-[#00205b]',
        className,
      )}
    >
      <span className="sr-only">Yükleniyor…</span>
    </span>
  )
}
