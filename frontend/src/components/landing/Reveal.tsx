import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  /** Stagger offset in seconds, for revealing siblings in sequence. */
  delay?: number
  className?: string
  as?: 'div' | 'section' | 'li'
}

/**
 * Scroll-entrance wrapper for the landing page. `whileInView` with `once` rather
 * than a scroll-linked transform: the element settles and then stays put, so the
 * long page never re-animates content the reader has already passed.
 *
 * Under `prefers-reduced-motion` the element renders in its final state with no
 * transition at all — not a faster one. A shortened slide is still a slide.
 */
export function Reveal({ children, delay = 0, className, as = 'div' }: RevealProps) {
  const reduceMotion = useReducedMotion()
  const MotionTag = motion[as]

  if (reduceMotion) {
    const Tag = as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  )
}
