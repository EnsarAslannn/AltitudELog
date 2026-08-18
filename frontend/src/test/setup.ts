import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

/**
 * jsdom ships no IntersectionObserver, and framer-motion's `whileInView` — which
 * drives the landing page's scroll reveals — constructs one on mount. The stub
 * never fires a callback, so revealed content renders in its `initial` state;
 * that is fine for assertions about structure and links, which is all these
 * tests make. Anything asserting post-reveal visuals would need a real observer.
 */
if (!('IntersectionObserver' in globalThis)) {
  // Deliberately not `implements IntersectionObserver`: the DOM lib keeps growing
  // members (scrollMargin was the latest), and every addition would break the
  // build over a test double that framer-motion only ever calls observe() on.
  class IntersectionObserverStub {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = ''
    readonly thresholds: ReadonlyArray<number> = []
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}

afterEach(() => {
  cleanup()
})
