import { useReducedMotion } from 'framer-motion'

interface VideoBackdropProps {
  /** Defaults to the Air 1 loop, which is the ground for every page in the app. */
  src?: string
  poster?: string
}

/**
 * The app's ground: one fixed clip behind an entire document.
 *
 * Shown exactly as shot — no wash, no scrim, no grade. Anything layered over the
 * whole clip would make the footage read differently in different places, and a
 * background that fades as you scroll is the specific thing this replaced.
 * Legibility is handled where it belongs instead: dark type on a uniformly bright
 * sky, and near-opaque surfaces under anything small enough to need one.
 *
 * `fixed` rather than a tall absolute element — a fixed layer costs one composited
 * surface no matter how long the page grows, and never has to be re-measured when
 * a section changes height. One element per document, not per section: two <video>
 * tags would decode two streams for a sky the reader experiences as one.
 */
export function VideoBackdrop({
  src = '/videos/air-backdrop.mp4',
  poster = '/images/clouds.jpg',
}: VideoBackdropProps) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#dce8f2]" aria-hidden="true">
      {/*
        Under `prefers-reduced-motion` the poster replaces the video outright
        rather than the video being paused: a looping backdrop is exactly the
        indefinite motion WCAG 2.2.2 asks to be stoppable, and there is no honest
        place to put a pause control on a decorative full-page background.
      */}
      {reduceMotion ? (
        <img src={poster} alt="" className="h-full w-full object-cover" loading="eager" />
      ) : (
        <video
          className="h-full w-full object-cover"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          disableRemotePlayback
        />
      )}
    </div>
  )
}
