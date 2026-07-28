import type { ReactNode } from 'react'
import { aircraftCategory, type AircraftCategory } from '../../data/aircraftTypes'
import { cn } from '../../lib/cn'

interface AircraftSilhouetteProps {
  /** Raw aircraft type code as stored on the flight — resolved to a category internally. */
  code: string
  className?: string
}

/*
 * Top-down plan-view silhouettes, one per airframe family. Drawn on the same 24×24 grid and
 * with the same `fill="currentColor"` convention as the aircraft mark in RouteRibbon, so they
 * inherit the surrounding text colour rather than introducing a palette entry of their own.
 *
 * These distinguish *categories*, not models. At 16px the three jet silhouettes (widebody /
 * narrowbody / regional) differ only in fuselage width, wing sweep and tail shape and will read
 * similarly — that is accepted, because the type code is always rendered next to the silhouette
 * and the job here is instant family recognition, not identification. Propeller discs are drawn
 * as outlined circles: they are the one cue that stays unmistakable at the smallest size used.
 *
 * Each silhouette is one `d` built from several closed subpaths (fuselage, wings, engines, tail)
 * that overlap. **Every subpath must wind the same way — clockwise in this y-down coordinate
 * system.** Under SVG's default `nonzero` fill rule, two overlapping subpaths of opposite winding
 * cancel, which punches white notches out of the wing and tail roots. Mirrored left-hand parts
 * are therefore written in reversed vertex order relative to their right-hand twin, not as a
 * naive x-mirror.
 */
const shapes: Record<AircraftCategory, ReactNode> = {
  widebody: (
    <path
      d="M12 1 C13.4 1 14.2 3.2 14.2 6 L14.2 18.5 L12.8 23 L11.2 23 L9.8 18.5 L9.8 6 C9.8 3.2 10.6 1 12 1 Z
         M13.6 9.5 L23.5 16.5 L23.5 18.3 L13.6 14 Z
         M10.4 9.5 L10.4 14 L0.5 18.3 L0.5 16.5 Z
         M16.8 12.6 L19 13.9 L18.2 16.4 L16 15.1 Z
         M7.2 12.6 L8 15.1 L5.8 16.4 L5 13.9 Z
         M13.2 18.5 L19 21.6 L19 22.9 L13.2 20.9 Z
         M10.8 18.5 L10.8 20.9 L5 22.9 L5 21.6 Z"
    />
  ),
  narrowbody: (
    <path
      d="M12 1 C13.1 1 13.5 3.2 13.5 6 L13.5 18.8 L12.7 23 L11.3 23 L10.5 18.8 L10.5 6 C10.5 3.2 10.9 1 12 1 Z
         M13 10.5 L22.5 16.8 L22.5 18.4 L13 14.6 Z
         M11 10.5 L11 14.6 L1.5 18.4 L1.5 16.8 Z
         M16.4 13.4 L18.2 14.6 L17.6 16.5 L15.8 15.3 Z
         M7.6 13.4 L8.2 15.3 L6.4 16.5 L5.8 14.6 Z
         M12.9 19 L17.5 21.8 L17.5 22.9 L12.9 21.1 Z
         M11.1 19 L11.1 21.1 L6.5 22.9 L6.5 21.8 Z"
    />
  ),
  // Short fuselage, mild sweep, and the T-tail that visually separates a regional jet from a
  // narrowbody at a glance.
  regional: (
    <path
      d="M12 2 C13.1 2 13.4 4 13.4 6.5 L13.4 19 L12.7 22.4 L11.3 22.4 L10.6 19 L10.6 6.5 C10.6 4 10.9 2 12 2 Z
         M13 11.5 L21.5 16.5 L21.5 17.9 L13 15 Z
         M11 11.5 L11 15 L2.5 17.9 L2.5 16.5 Z
         M15.1 13.8 L17.2 14.9 L16.7 16.6 L14.6 15.5 Z
         M8.9 13.8 L9.4 15.5 L7.3 16.6 L6.8 14.9 Z
         M6 20.9 L18 20.9 L18 22.4 L6 22.4 Z"
    />
  ),
  /*
   * The two straight-wing families. Their wings are drawn as tapered trapezoids (thicker at the
   * root than the tip) rather than plain bars — an untapered bar crossing a thin fuselage reads
   * as a plus sign, not an aircraft. Nacelles overlap their prop discs so the disc sits on the
   * wing instead of floating above it.
   */
  turboprop: (
    <>
      <path
        d="M12 2.4 C13.3 2.4 13.6 4.4 13.6 6.8 L13.6 18.8 L12.7 22.3 L11.3 22.3 L10.4 18.8 L10.4 6.8 C10.4 4.4 10.7 2.4 12 2.4 Z
           M12 9.7 L22.5 9.7 L22.5 11.2 L12 12.1 Z
           M12 9.7 L12 12.1 L1.5 11.2 L1.5 9.7 Z
           M16.4 8.2 L18.4 8.2 L18.4 13.8 L16.4 13.8 Z
           M5.6 8.2 L7.6 8.2 L7.6 13.8 L5.6 13.8 Z
           M12 19.6 L18.2 19.6 L18.2 21.1 L12 21.7 Z
           M12 19.6 L12 21.7 L5.8 21.1 L5.8 19.6 Z"
      />
      <circle cx="6.6" cy="7.6" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="17.4" cy="7.6" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.25" />
    </>
  ),
  piston: (
    <>
      <path
        d="M12 3.4 C13.4 3.4 13.7 5.2 13.7 7 L13.7 17.8 L12.8 21.2 L11.2 21.2 L10.3 17.8 L10.3 7 C10.3 5.2 10.6 3.4 12 3.4 Z
           M12 9.5 L20.5 9.5 L20.5 11.2 L12 12.3 Z
           M12 9.5 L12 12.3 L3.5 11.2 L3.5 9.5 Z
           M12 18 L16.8 18 L16.8 19.6 L12 20.4 Z
           M12 18 L12 20.4 L7.2 19.6 L7.2 18 Z"
      />
      <circle cx="12" cy="3.6" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </>
  ),
  // Sharp sweep plus engines mounted on the rear fuselage rather than under the wing.
  bizjet: (
    <path
      d="M12 1.5 C13 1.5 13.3 3.5 13.3 6 L13.3 18.5 L12.7 22.8 L11.3 22.8 L10.7 18.5 L10.7 6 C10.7 3.5 11 1.5 12 1.5 Z
         M13 11 L23 17.2 L23 18.6 L13 14.4 Z
         M11 11 L11 14.4 L1 18.6 L1 17.2 Z
         M13.4 16.6 L15.5 16.6 L15.5 20 L13.4 20 Z
         M10.6 16.6 L10.6 20 L8.5 20 L8.5 16.6 Z
         M6.5 21.3 L17.5 21.3 L17.5 22.8 L6.5 22.8 Z"
    />
  ),
  helicopter: (
    <>
      <path
        d="M12 7.4 C13.9 7.4 15 9.1 15 11.2 C15 13.3 13.9 15 12 15 C10.1 15 9 13.3 9 11.2 C9 9.1 10.1 7.4 12 7.4 Z
           M11.3 13.8 L12.7 13.8 L12.7 21 L11.3 21 Z
           M9.6 20.3 L14.4 20.3 L14.4 21.8 L9.6 21.8 Z"
      />
      <path
        d="M4.5 3.7 L19.5 18.3 M19.5 3.7 L4.5 18.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </>
  ),
  // Reuses the generic aircraft mark already used as the in-transit figure on RouteRibbon,
  // so an unrecognised type falls back to the app's existing aviation glyph rather than a gap.
  unknown: (
    <path d="M12 2 L14 12 L22 16 L22 18 L13 16 L13 21 L16 23 L16 24 L12 22.5 L8 24 L8 23 L11 21 L11 16 L2 18 L2 16 L10 12 Z" />
  ),
}

/**
 * Category silhouette for an aircraft type code. Decorative: the code (and usually the model
 * name) is always rendered alongside it, so the graphic carries no information of its own and
 * is hidden from assistive technology.
 */
export function AircraftSilhouette({ code, className }: AircraftSilhouetteProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn('shrink-0', className)}
      fill="currentColor"
      aria-hidden
    >
      {shapes[aircraftCategory(code)]}
    </svg>
  )
}
