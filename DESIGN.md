---
name: Skyline UI
colors:
  surface: '#f5f6ff'
  surface-dim: '#c4d4fb'
  surface-bright: '#f5f6ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf0ff'
  surface-container: '#e0e8ff'
  surface-container-high: '#d8e2ff'
  surface-container-highest: '#cfddff'
  on-surface: '#252f43'
  on-surface-variant: '#525b72'
  inverse-surface: '#040e21'
  inverse-on-surface: '#939db6'
  outline: '#6d778e'
  outline-variant: '#a3adc7'
  surface-tint: '#006382'
  primary: '#006382'
  on-primary: '#e5f5ff'
  primary-container: '#7bd1fa'
  on-primary-container: '#00465d'
  inverse-primary: '#7bd1fa'
  secondary: '#346176'
  on-secondary: '#e6f5ff'
  secondary-container: '#b1ddf7'
  on-secondary-container: '#215065'
  tertiary: '#5a5c5c'
  on-tertiary: '#f2f3f3'
  tertiary-container: '#ffffff'
  on-tertiary-container: '#616263'
  error: '#b31b25'
  on-error: '#ffefee'
  error-container: '#fb5151'
  on-error-container: '#570008'
  primary-fixed: '#7bd1fa'
  primary-fixed-dim: '#6cc3eb'
  on-primary-fixed: '#003041'
  on-primary-fixed-variant: '#004f69'
  secondary-fixed: '#b1ddf7'
  secondary-fixed-dim: '#a3cfe8'
  on-secondary-fixed: '#063d51'
  on-secondary-fixed-variant: '#2c596f'
  tertiary-fixed: '#ffffff'
  tertiary-fixed-dim: '#f0f1f1'
  on-tertiary-fixed: '#4f5051'
  on-tertiary-fixed-variant: '#6c6d6e'
  primary-dim: '#005672'
  secondary-dim: '#27556a'
  tertiary-dim: '#4e5050'
  error-dim: '#9f0519'
  background: '#f5f6ff'
  on-background: '#252f43'
  surface-variant: '#cfddff'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 16px
  margin: 24px
---

# Design System: Skyline UI

## Brand & Style
Skyline UI is defined by a sense of clarity, openness, and technical precision. Moving away from the heavy, earthy tones of the previous iteration, the brand now embraces a "Vibrant Corporate" aesthetic. It evokes feelings of innovation, trust, and fluid efficiency. 

The target audience consists of modern professionals and tech-forward teams who value clean interfaces that reduce cognitive load. The visual language is inspired by high-end SaaS platforms: airy layouts, crisp typography, and a "light-filled" atmosphere that feels both approachable and professional.

## Colors
The color palette is anchored by a vibrant Sky Blue primary color (#7dd3fc), signaling a fresh and energetic direction. This is supported by a muted blue-grey secondary tone that provides professional balance without competing for attention.

- **Primary:** Sky Blue (#7dd3fc) - Used for primary actions, active states, and brand highlights.
- **Secondary:** Muted Slate (#88b4cc) - Used for supportive UI elements and secondary accents.
- **Tertiary:** Cloud White (#fafafa) - Used for subtle backgrounds and surface differentiations.
- **Neutral:** Deep Navy (#1a2438) - Used for high-contrast typography and structural borders to ensure legibility and depth.

## Typography
The system has transitioned to **Inter** for all text roles, replacing the previous sans-serif to achieve a more modern, "tech-native" look. Inter’s tall x-height and excellent legibility make it ideal for data-heavy interfaces.

Headlines utilize heavier weights (600-700) to create a clear hierarchy against the vibrant primary accents. Body text remains clean and readable, while labels use a medium weight with slight letter spacing to ensure clarity at small sizes.

## Layout & Spacing
The layout follows a fluid 12-column grid system designed for flexibility. Spacing is governed by a consistent 8px rhythmic scale. 

- **Desktop:** 24px margins and 16px gutters provide a breathable, professional structure.
- **Mobile:** Margins scale down to 16px, and gutters tighten to 12px to maximize screen real estate.
- The philosophy emphasizes "negative space as a feature," ensuring that the vibrant primary color doesn't overwhelm the user.

## Elevation & Depth
Elevation is communicated through **tonal layers** and **ambient shadows**. Surfaces are primarily flat, but interactive components (like cards and modals) use soft, diffused shadows with a slight tint of the neutral navy to ground them.

Backdrop blurs are used sparingly for navigation overlays to maintain the "glassy" modern feel of the new aesthetic, allowing the background colors to peek through without sacrificing readability.

## Shapes
The design system has shifted from sharp corners to a **Rounded** corner strategy. This softens the overall interface and aligns with the friendly, innovative brand personality.

- **Standard Components (Buttons/Inputs):** 0.5rem (8px) radius.
- **Large Containers/Cards:** 1rem (16px) radius.
- **Extra Large Elements:** 1.5rem (24px) radius.

## Components
- **Buttons:** Feature 8px rounded corners. Primary buttons use the Sky Blue background with Deep Navy text for maximum contrast. Secondary buttons use a subtle Slate outline.
- **Input Fields:** Outlined with the Neutral Navy at low opacity, using an 8px radius. Active states focus with a 2px Sky Blue border.
- **Cards:** Utilize a 16px corner radius and subtle ambient shadows to lift them from the Tertiary Cloud White background.
- **Chips:** Highly rounded (pill-shaped) to distinguish them from buttons, utilizing the Secondary Slate for a subdued visual presence.