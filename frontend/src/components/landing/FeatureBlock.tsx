import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Reveal } from './Reveal'

interface FeatureBlockProps {
  id: string
  eyebrow: string
  title: ReactNode
  body: string
  points: string[]
  image: string
  imageAlt: string
  reverse?: boolean
}

export function FeatureBlock({
  id,
  eyebrow,
  title,
  body,
  points,
  image,
  imageAlt,
  reverse = false,
}: FeatureBlockProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 py-20 sm:py-28"
    >
      <div className="relative z-30 mx-auto grid max-w-[1150px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
        <Reveal className={cn(reverse && 'lg:order-2')}>
          <p className="eyebrow mb-5 text-xs font-medium text-[color:var(--air-accent)]">{eyebrow}</p>
          <h2 className="text-[clamp(1.75rem,3.4vw,3.25rem)] font-medium leading-[1.08] tracking-[-0.02em] text-[color:var(--air-fg)]">
            {title}
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[color:var(--air-fg-muted)]">{body}</p>

          <ul className="mt-8 max-w-lg">
            {points.map((point) => (
              <li
                key={point}
                className="flex gap-3 border-b border-[color:var(--air-rule)] py-3.5 text-[15px] leading-relaxed text-[color:var(--air-fg-muted)] last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[color:var(--air-accent)]"
                />
                {point}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.08} className={cn(reverse && 'lg:order-1')}>
          <img
            src={image}
            alt={imageAlt}
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-[14px] border border-whiteout/50 shadow-[0_24px_60px_-30px_rgba(20,33,61,0.55)]"
          />
        </Reveal>
      </div>
    </section>
  )
}
