import { useReducedMotion } from 'framer-motion'

/**
 * The landing page's single, page-wide backdrop.
 *
 * One fixed video element behind the entire document rather than one per
 * section: the sections above it are translucent, so the same footage carries
 * through the whole scroll as a continuous sky. Two separate <video> tags would
 * decode two streams for a backdrop the reader experiences as one.
 *
 * `fixed` rather than a tall absolute element — a fixed layer costs one
 * composited surface no matter how long the page grows, and never has to be
 * re-measured when a section changes height.
 */
export function PageBackdrop() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/*
        Under `prefers-reduced-motion` the poster replaces the video outright
        rather than the video being paused: a looping backdrop is exactly the
        indefinite motion WCAG 2.2.2 asks to be stoppable, and there is no honest
        place to put a pause control on a decorative full-page background.
      */}
      {reduceMotion ? (
        <img src="/images/clouds.jpg" alt="" className="h-full w-full object-cover" loading="eager" />
      ) : (
        <video
          className="h-full w-full object-cover"
          src="/videos/air-backdrop.mp4"
          poster="/images/clouds.jpg"
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

      {/*
        A flat wash over the whole clip. The translucent section grounds above do
        most of the legibility work, but the two places that show the footage at
        full strength — the hero and the display interlude — need the luminance
        swing taken out of it before white type lands on top.
      */}
      <div className="absolute inset-0 bg-black-void/35" />
    </div>
  )
}
