import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-sm bg-void-800', className)} />
}

export function SkeletonCard() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 rounded-sm border border-void-700 bg-void-900 p-6 shadow-sm">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-64" />
    </div>
  )
}
