/**
 * Atmospheric break between the feature blocks — DESIGN.md's poster-scale
 * "Compressed Display Headline".
 *
 * Like the hero, this section carries no video of its own: it is a window where
 * the page-wide backdrop is left unscreened, so the same clip that has been
 * showing faintly through the translucent sections above comes back to full
 * strength. That contrast is the whole point of the break.
 *
 * The type deliberately bleeds past the 1150px content column: every other
 * section is measured and gridded, so this one earns its impact by being the
 * only place on the page that ignores the container.
 */
export function DisplayInterlude() {
  return (
    <section
      data-nav-tone="dark"
      className="air-tone-dark relative flex min-h-[72svh] items-center justify-center"
    >
      <div className="air-interlude-scrim absolute inset-0 z-10" />

      <div className="relative z-30 w-full px-4 text-center">
        <h2 className="air-display text-[clamp(2.75rem,12.5vw,15rem)] text-whiteout">
          Her uçuş
          <br />
          kayıt altında
        </h2>
        <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-whiteout/80">
          Rota, mürettebat, hava durumu ve güvenlik raporu — hepsi aynı kaydın parçası.
        </p>
      </div>
    </section>
  )
}
