import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
  glass?: boolean
}

export function Card({ interactive, glass, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg p-6 transition-all',
        glass
          ? 'glass-panel'
          : // Glass, not a solid fill. Every signed-in page sits on the Air 1 clip,
            // and an opaque card reads as a rectangle pasted onto the footage
            // rather than a panel floating in it.
            //
            // 40% white is only legible because the clip is a bright sky: it
            // composites to roughly #d9e4ee–#f0f2f4, which carries the navy
            // `--color-on-surface` at 10–13:1. The same 40% over a dark backdrop
            // would fail outright — the alpha is tied to the footage, not a taste
            // call. `backdrop-blur-md` is what stops moving cloud from pulling the
            // eye off the text sitting on top of it.
            'border border-white/30 bg-white/40 shadow-lg backdrop-blur-md',
        interactive &&
          'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[var(--shadow-panel-hover)]',
        className,
      )}
      {...props}
    />
  )
}
