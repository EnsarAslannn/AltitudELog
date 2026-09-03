import {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useReducedMotion } from 'framer-motion'

const AirbusModel = lazy(() => import('./AirbusModel'))

/** How long to wait for the browser to restore a lost context before remounting. */
const RESTORE_GRACE_MS = 1500

/** After this many losses the layer gives up rather than thrashing the GPU. */
const MAX_CONTEXT_RETRIES = 2

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    if (!window.WebGLRenderingContext || !context) return false

    // Release it immediately: a browser allows only a handful of live contexts
    // (~16 in Chrome) and drops the oldest when the limit is hit, so a probe
    // context left to garbage collection can cost the real canvas its context.
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

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

export function SculptureLayer() {
  const [enabled, setEnabled] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [paused, setPaused] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)
  const reduceMotion = useReducedMotion() ?? false
  const scrollProgress = useRef(0)
  const retries = useRef(0)
  const restoreTimer = useRef<number | null>(null)

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

  // A hidden tab still runs the render loop, and this page also decodes a
  // full-screen video — pausing while hidden takes that pressure off the GPU,
  // which is the pressure that costs the canvas its context in the first place.
  useEffect(() => {
    if (!enabled) return

    const sync = () => setPaused(document.hidden)
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [enabled])

  const clearRestoreTimer = () => {
    if (restoreTimer.current === null) return
    window.clearTimeout(restoreTimer.current)
    restoreTimer.current = null
  }

  const handleContextLost = useCallback(() => {
    if (restoreTimer.current !== null) return

    restoreTimer.current = window.setTimeout(() => {
      restoreTimer.current = null

      if (retries.current >= MAX_CONTEXT_RETRIES) {
        console.warn('Landing 3D model: WebGL context lost repeatedly; disabling the layer.')
        setGaveUp(true)
        return
      }

      retries.current += 1
      setCanvasKey((key) => key + 1)
    }, RESTORE_GRACE_MS)
  }, [])

  // The browser restored the context on its own; three re-initialises itself,
  // so the pending remount would only throw away a working canvas.
  const handleContextRestored = useCallback(() => clearRestoreTimer(), [])

  useEffect(() => clearRestoreTimer, [])

  if (!enabled || gaveUp) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-20 hidden md:block" aria-hidden="true">
      <ModelBoundary>
        <Suspense fallback={null}>
          <AirbusModel
            key={canvasKey}
            scrollProgress={scrollProgress}
            reduceMotion={reduceMotion}
            paused={paused}
            onContextLost={handleContextLost}
            onContextRestored={handleContextRestored}
          />
        </Suspense>
      </ModelBoundary>
    </div>
  )
}
