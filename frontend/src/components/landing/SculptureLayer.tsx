import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { useReducedMotion } from 'framer-motion'

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
