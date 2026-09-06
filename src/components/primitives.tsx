import { useState, type ReactNode } from 'react'
import type { SectionMeta } from '../data/types'
import { Reveal, Stagger } from './motion'
import { themedIcons } from './BrandIcon'

/** Section header (title + optional multi-line subtitle) with its content below. */
export function Section({
  title,
  subtitle,
  children,
}: SectionMeta & { children: ReactNode }) {
  return (
    <section className="flex w-full flex-col gap-4">
      <Reveal className="flex flex-col gap-2">
        <h2 className="text-lg font-bold leading-5 text-primary">{title}</h2>
        {subtitle && (
          <p className="whitespace-pre-line text-sm leading-5 text-muted">{subtitle}</p>
        )}
      </Reveal>
      {children}
    </section>
  )
}

/**
 * Rounded card whose children are flat rows separated by a 2px gap.
 * overflow-hidden + rounded-card clips the first/last rows to 16px corners,
 * exactly like the Figma group.
 */
export function CardGroup({ children }: { children: ReactNode }) {
  return (
    <Stagger className="flex flex-col gap-0.5 overflow-hidden rounded-card">{children}</Stagger>
  )
}

/** <img> that removes itself (keeping layout) if the asset is missing. */
export function AssetImg({
  src,
  alt = '',
  className,
}: {
  src: string
  alt?: string
  className?: string
}) {
  const [ok, setOk] = useState(true)
  const Themed = themedIcons[src]
  if (Themed) return <Themed className={className} />
  if (!ok) return <span className={className} aria-hidden />
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setOk(false)}
    />
  )
}

/** Generic UI glyph (not a brand asset) — inlined so it themes via currentColor. */
export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1" />
      <path
        d="M7.5 12.5 12.5 7.5M8.2 7.5h4.3v4.3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
