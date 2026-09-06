import type { ComponentType } from 'react'

/**
 * Theme-aware brand marks. An <img> to an external SVG can't be recoloured by
 * CSS, so these are inlined (or CSS-masked) and painted with the theme tokens:
 *   white parts → var(--color-primary)   (white in dark, near-black in light)
 *   black parts → var(--color-background) (black in dark, white in light)
 * They flip automatically when [data-theme] changes.
 */

type IconProps = { className?: string }

/** Preplab — speech bubble (primary) with two eyes (background). */
function Preplab({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" aria-hidden>
      <path
        d="M20 40C31.0457 40 40 31.0457 40 20C40 8.9543 31.0457 0 20 0C8.9543 0 0 8.9543 0 20V36.6667C0 38.5076 1.49238 40 3.33333 40H20Z"
        fill="var(--color-primary)"
      />
      <circle cx="13.3333" cy="20.0003" r="3.33333" fill="var(--color-background)" />
      <circle cx="26.6666" cy="20.0003" r="3.33333" fill="var(--color-background)" />
    </svg>
  )
}

/** m2vc — rounded square (primary) with the wordmark cut in the background colour. */
function M2vc({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" aria-hidden>
      <rect width="20" height="20" rx="4" fill="var(--color-primary)" />
      <path
        d="M12.4977 7.58793C12.0502 7.34405 11.5596 7.22212 11.0267 7.22212C10.4934 7.22212 10.0459 7.32988 9.62705 7.54579C9.20783 7.76132 8.86982 8.085 8.613 8.51606C8.38451 8.13161 8.05593 7.81763 7.62728 7.57376C7.20844 7.33958 6.73219 7.22212 6.1993 7.22212C5.75138 7.22212 5.32801 7.31609 4.92805 7.50328C4.5568 7.68152 4.26146 7.95821 4.04241 8.33334V7.39104H2.5V15.0003H4.11379V10.5133C4.11379 9.95096 4.26599 9.50535 4.57078 9.1772C4.86574 8.85875 5.26116 8.69915 5.75629 8.69915C6.25142 8.69915 6.64646 8.85875 6.94142 9.1772C7.2462 9.50535 7.39878 9.95096 7.39878 10.5133V15.0003H8.99822V10.5133C8.99822 9.94126 9.15534 9.49603 9.46956 9.1772C9.76452 8.85875 10.1599 8.69915 10.6551 8.69915C11.1502 8.69915 11.5452 8.85875 11.8402 9.1772C12.1352 9.49603 12.2832 9.94164 12.2832 10.5133V15.0003H13.897V10.0774C13.897 9.52437 13.7735 9.0273 13.5258 8.58654C13.2686 8.1551 12.9264 7.82248 12.4977 7.58793ZM16.5237 7.02933C16.7148 6.8276 16.8716 6.64749 16.9883 6.49497C17.1227 6.32232 17.2205 6.16869 17.2874 6.02587L17.2911 6.01729C17.364 5.84875 17.4007 5.67461 17.4007 5.49972C17.4007 5.24093 17.3384 5.00899 17.2156 4.80986C17.0944 4.61372 16.9225 4.45487 16.7061 4.33778C16.4977 4.22442 16.251 4.16699 15.9734 4.16699C15.5943 4.16699 15.2612 4.277 14.9836 4.49327L14.979 4.49663C14.7015 4.72111 14.5213 5.01868 14.4435 5.38151L14.3785 5.68505L15.351 5.89499L15.4243 5.59779C15.464 5.43782 15.5282 5.32408 15.6215 5.251L15.6256 5.24764C15.7197 5.1712 15.8352 5.13391 15.9784 5.13391C16.1117 5.13391 16.2099 5.16411 16.2786 5.22676C16.3013 5.24727 16.37 5.30954 16.37 5.49972C16.37 5.58735 16.3515 5.66305 16.3141 5.73166C16.2593 5.83122 16.1781 5.94309 16.072 6.06465C15.839 6.32046 15.6781 6.49646 15.5803 6.60237L14.4669 7.80943V8.48698H17.5V7.52006H16.0713L16.5245 7.02933H16.5237Z"
        fill="var(--color-background)"
      />
    </svg>
  )
}

/** XYZ School — monochrome mark; CSS-masked so it takes the primary token. */
function Xyz({ className }: IconProps) {
  return (
    <span
      className={className}
      aria-hidden
      style={{
        display: 'inline-block',
        backgroundColor: 'var(--color-primary)',
        WebkitMask: 'url(/icons/xyz.svg) center / contain no-repeat',
        mask: 'url(/icons/xyz.svg) center / contain no-repeat',
      }}
    />
  )
}

/** Icons keyed by the src used in the data — rendered theme-aware instead of <img>. */
export const themedIcons: Record<string, ComponentType<IconProps>> = {
  '/icons/preplab.svg': Preplab,
  '/icons/m2vc.svg': M2vc,
  '/icons/xyz.svg': Xyz,
}
