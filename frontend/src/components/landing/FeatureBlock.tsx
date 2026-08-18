import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Reveal } from './Reveal'
import { toneClass, type SectionTone } from './tones'

interface FeatureBlockProps {
  id: string
  tone: SectionTone
  eyebrow: string
  title: ReactNode
  body: string
  points: string[]
  image: string
  imageAlt: string
  /** Puts the photograph on the left. Alternated down the page so the eye zig-zags. */
  reverse?: boolean
}

export function FeatureBlock({
  id,
  tone,
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
      data-nav-tone={tone}
      // scroll-mt clears the 72px fixed nav — without it an anchor jump parks the
      // section heading underneath the bar.
      className={cn(toneClass[tone], 'air-ground scroll-mt-24 py-20 sm:py-28')}
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

        {/*
          A bare rounded image, not a card. DESIGN.md wraps *product screenshots* in
          a Haze card so the app's own light UI gets a deliberate edge against a dark
          ground; these are full-bleed photographs on a light ground, where a card
          would add a frame around a frame. Its "Image Card with Radius" — transparent,
          11-14px radius, no padding — is the rule that applies here.
        */}
        <Reveal delay={0.08} className={cn(reverse && 'lg:order-1')}>
          <img
            src={image}
            alt={imageAlt}
            width={1024}
            height={1024}
            loading="lazy"
            decoding="async"
            className="h-auto w-full rounded-[14px] border border-[color:var(--air-rule)]"
          />
        </Reveal>
      </div>
    </section>
  )
}
