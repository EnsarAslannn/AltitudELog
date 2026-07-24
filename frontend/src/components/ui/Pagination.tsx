import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'

interface PaginationProps {
  pageNumber: number
  totalPages: number
  onPageChange: (pageNumber: number) => void
  disabled?: boolean
}

export function Pagination({ pageNumber, totalPages, onPageChange, disabled }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Sayfalama" className="flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        icon={ChevronLeft}
        disabled={disabled || pageNumber <= 1}
        onClick={() => onPageChange(pageNumber - 1)}
      >
        Önceki
      </Button>
      <span className="data text-sm text-slate-500" aria-live="polite">
        Sayfa {pageNumber} / {totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={disabled || pageNumber >= totalPages}
        onClick={() => onPageChange(pageNumber + 1)}
      >
        Sonraki
        <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
      </Button>
    </nav>
  )
}
