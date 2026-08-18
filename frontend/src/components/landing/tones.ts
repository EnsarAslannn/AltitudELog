/**
 * The landing page's three section grounds.
 *
 * Kept in their own module rather than beside a component: every landing
 * component and the navigation import them, and exporting constants from a file
 * that also exports a component breaks React Fast Refresh for that file.
 *
 * `toneClass` maps to the CSS variable blocks in index.css. `groundColor` repeats
 * those values as literals because the seam gradients need them as real colours
 * in an inline style — a `var()` resolved against the seam's own element would
 * pick up whichever tone it happens to inherit rather than the two it bridges.
 */
export type SectionTone = 'dark' | 'blue' | 'cream'

export const toneClass: Record<SectionTone, string> = {
  dark: 'air-tone-dark',
  blue: 'air-tone-blue',
  cream: 'air-tone-cream',
}

/*
 * Every ground is an rgba over the page-wide video, and the seams must ramp
 * between them in ALPHA, never through a colour.
 *
 * The `dark` entry is therefore a fully transparent *vapor*, not `transparent`
 * and not black: browsers interpolate gradients in premultiplied sRGB, so a stop
 * of literal `transparent` (rgba(0,0,0,0)) fading into vapor drags the midpoint
 * toward black and paints a dirty grey band across the seam. Matching the RGB on
 * both stops keeps the ramp purely in opacity.
 */
export const groundColor: Record<SectionTone, string> = {
  dark: 'rgba(232, 240, 249, 0)',
  blue: 'rgba(232, 240, 249, 0.8)',
  cream: 'rgba(247, 242, 232, 0.8)',
}
