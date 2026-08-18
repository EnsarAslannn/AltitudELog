import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn'
import { groundColor, type SectionTone } from './tones'

interface SectionSeamProps {
  from: SectionTone
  to: SectionTone
  /** Taller for the dark↔light jumps, which need more room to resolve. */
  height?: 'sm' | 'lg'
}

/**
 * The bridge between two adjacent sections.
 *
 * Sections themselves stay flat colour; this is the only element on the page
 * allowed a gradient, because a hard edge between two grounds is precisely what
 * the page is meant not to have. It is `aria-hidden` and has no content — purely
 * a colour ramp, so it never adds a stop to the reading or tab order.
 */
export function SectionSeam({ from, to, height = 'sm' }: SectionSeamProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('air-seam w-full', height === 'lg' ? 'h-40 sm:h-56' : 'h-20 sm:h-28')}
      style={
        {
          '--air-seam-from': groundColor[from],
          '--air-seam-to': groundColor[to],
        } as CSSProperties
      }
    />
  )
}
