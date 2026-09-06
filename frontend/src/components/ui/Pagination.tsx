import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { useT } from '../../i18n'

interface PaginationProps {
  pageNumber: number
  totalPages: number
  onPageChange: (pageNumber: number) => void
  disabled?: boolean
}

export function Pagination({ pageNumber, totalPages, onPageChange, disabled }: PaginationProps) {
  const t = useT()

  if (totalPages <= 1) return null

  return (
    <nav aria-label={t('pagination.label')} className="flex items-center justify-center gap-3">
      <Button
        variant="secondary"
        icon={ChevronLeft}
        disabled={disabled || pageNumber <= 1}
        onClick={() => onPageChange(pageNumber - 1)}
      >
        {t('pagination.previous')}
      </Button>
      <span className="text-sm text-on-surface-variant" aria-live="polite">
        {t('pagination.status', { page: pageNumber, total: totalPages })}
      </span>
      <Button
        variant="secondary"
        disabled={disabled || pageNumber >= totalPages}
        onClick={() => onPageChange(pageNumber + 1)}
      >
        {t('pagination.next')}
        <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
      </Button>
    </nav>
  )
}
