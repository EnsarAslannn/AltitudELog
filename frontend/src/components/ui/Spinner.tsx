import { cn } from '../../lib/cn'

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-void-600 border-t-phosphor-500',
        className,
      )}
    >
      <span className="sr-only">Yükleniyor…</span>
    </span>
  )
}
