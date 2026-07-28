import { cn } from '../../lib/cn'

interface RouteRibbonProps {
  origin: string
  destination: string
  size?: 'sm' | 'md' | 'lg'
  /** `strong` for hero/preview contexts, `soft` for dense list rows. */
  emphasis?: 'strong' | 'soft'
  animated?: boolean
  className?: string
}

const codeSize = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl sm:text-5xl',
}

const arcHeight = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-14',
}

/**
 * Departure-board style route strip: origin → destination in aviation figures,
 * joined by a dashed great-circle arc with a small aircraft in transit.
 * The signature motif of the app — reused on the dashboard, flight detail, and create-flight preview.
 *
 * The palette carries no accent hue, so origin and destination are told apart by weight
 * rather than colour: the origin node is hollow, the destination node filled.
 */
export function RouteRibbon({
  origin,
  destination,
  size = 'md',
  emphasis = 'soft',
  animated = false,
  className,
}: RouteRibbonProps) {
  // `strong` ribbons span a full hero band, so their outer codes land past the edge of the
  // scrim and onto open photography — the halo keeps them readable there.
  const code = emphasis === 'strong' ? 'text-on-surface on-photo' : 'text-on-surface-variant'
  const stroke = emphasis === 'strong' ? 'rgba(28,27,27,0.45)' : 'rgba(28,27,27,0.3)'

  return (
    <div className={cn('flex items-center gap-3 sm:gap-5', className)}>
      <span className={cn('data font-semibold tabular-nums', codeSize[size], code)}>
        {origin || '····'}
      </span>

      <div className={cn('relative flex-1', arcHeight[size])}>
        <svg
          viewBox="0 0 200 48"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <path
            d="M6,40 Q100,-4 194,40"
            fill="none"
            stroke={stroke}
            strokeWidth="1.5"
            strokeDasharray="2 6"
            strokeLinecap="round"
            className={animated ? 'arc-live' : undefined}
          />
        </svg>
        {/* origin node — hollow */}
        <span className="absolute bottom-0 left-0 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-primary bg-surface-container-lowest" />
        {/* aircraft in transit at the apex */}
        <svg
          viewBox="0 0 24 24"
          className={cn(
            'absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 drop-shadow-[0_0_4px_rgba(28,27,27,0.25)]',
            code,
          )}
          fill="currentColor"
          aria-hidden
        >
          <path d="M12 2 L14 12 L22 16 L22 18 L13 16 L13 21 L16 23 L16 24 L12 22.5 L8 24 L8 23 L11 21 L11 16 L2 18 L2 16 L10 12 Z" />
        </svg>
        {/* destination node — filled */}
        <span className="absolute bottom-0 right-0 h-2 w-2 translate-x-1/2 translate-y-1/2 rounded-full bg-primary ring-2 ring-surface" />
      </div>

      <span className={cn('data font-semibold tabular-nums', codeSize[size], code)}>
        {destination || '····'}
      </span>
    </div>
  )
}
