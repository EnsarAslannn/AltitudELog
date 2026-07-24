import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-slate-200', className)} />
}

export function SkeletonCard() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-64" />
    </div>
  )
}
