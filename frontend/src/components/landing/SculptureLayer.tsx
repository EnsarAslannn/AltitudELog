import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

// three + R3F + drei are ~600kB of the bundle, and the aircraft model another
// 2.5MB over the wire. Splitting them out keeps all of it off the critical path
// for the signed-in application, which never renders any of it.
const AirbusModel = lazy(() => import('./AirbusModel'))

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

/**
 * Renders nothing at all if the 3D layer fails for any reason.
 *
 * This is not defensive padding — without it, a model that cannot load takes the
 * entire landing page down. `useGLTF` throws into the nearest boundary, and with
 * none of our own the throw reaches the router's default error screen, so a
 * missing asset, a blocked WASM decoder or a browser without `wasm-unsafe-eval`
 * support replaces the whole page with a stack trace. The aircraft is decoration;
 * its absence must cost nothing but the aircraft.
 */
class ModelBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('Landing 3D model unavailable; continuing without it.', error)
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

/**
 * The aircraft layer: one fixed, full-viewport canvas that persists for the whole
 * page rather than living inside the hero.
 *
 * Its z-index is the load-bearing part. The canvas sits ABOVE the translucent
 * section grounds so the aircraft stays crisp as it crosses them, and BELOW every
 * content wrapper (`relative z-30`) so it passes behind headings and body copy
 * without ever competing with them for legibility.
 *
 * Two hard gates remain: no WebGL means no canvas at all, and phones never get
 * it. The aircraft is a 2.5MB download and ~470k triangles — on a mid-range phone
 * that competes directly with the backdrop video decode, and the video is the
 * thing that must not stutter.
 */
export function SculptureLayer() {
  const [enabled, setEnabled] = useState(false)
  const reduceMotion = useReducedMotion() ?? false
  const scrollProgress = useRef(0)

  useEffect(() => {
    if (!supportsWebGL()) return

    const query = window.matchMedia('(min-width: 768px)')
    const sync = () => setEnabled(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!enabled) return

    // Progress across the WHOLE document, not just the hero: the aircraft is now
    // free for the length of the page, so its flight path is parameterised by how
    // far the reader has come overall.
    //
    // Written to a ref, never to state: this fires on every scroll frame, and a
    // setState here would re-render the layer ~60 times a second.
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      scrollProgress.current = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden md:block" aria-hidden="true">
      <ModelBoundary>
        <Suspense fallback={null}>
          <AirbusModel scrollProgress={scrollProgress} reduceMotion={reduceMotion} />
        </Suspense>
      </ModelBoundary>
    </div>
  )
}
