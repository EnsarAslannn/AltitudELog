/**
 * The landing page's two call-to-action treatments.
 *
 * Kept in their own module rather than beside a component: the hero, the
 * navigation and the closing block all use them, and exporting constants from a
 * file that also exports a component breaks React Fast Refresh for that file.
 *
 * The primary is deep navy — the same `--color-primary` the application uses for
 * its own brand actions, so the button a visitor presses on the landing page is
 * the colour they meet again once signed in.
 *
 * It went through two earlier fills. DESIGN.md's Haze worked while the hero was
 * scrimmed dark, but a near-white button on a white cloud has no edge at all;
 * Ink held its shape and read as a hard black rectangle against a golden sky.
 * Navy keeps the contrast (14:1 with white) while belonging to the palette.
 */
export const solidCta =
  'min-h-12 items-center justify-center whitespace-nowrap rounded-lg bg-primary px-6 text-sm font-medium text-on-primary transition-colors hover:bg-primary-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue'

export const ghostCta =
  'min-h-12 items-center justify-center whitespace-nowrap rounded-lg border border-[color:var(--air-fg)]/45 px-6 text-sm font-medium text-[color:var(--air-fg)] transition-colors hover:border-[color:var(--air-fg)] hover:bg-[color:var(--air-fg)]/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-blue'
