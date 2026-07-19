import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-slate-200', className)} />
}

export function SkeletonCard() {
  return (
    <div className="glass flex flex-col gap-3 rounded-lg p-6">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-64" />
    </div>
  )
}
