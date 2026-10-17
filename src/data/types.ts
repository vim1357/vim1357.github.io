export type SectionMeta = { title: string; subtitle?: string }

export type Contact = {
  label: string
  /** Muted trailing note after the label, e.g. "(30 мин)" */
  note?: string
  href: string
  icon: string
  /** Telegram-blue highlighted button */
  accent?: boolean
  /** Muted line under the button; wraps both in a lighter plate */
  caption?: string
}

/**
 * Right-side revenue cell.
 * `note` → muted text (e.g. "Выручка — пока тайна").
 * `value` → green count-up number with literal prefix/suffix (e.g. "+", 700, "k ₽").
 */
export type Revenue =
  | { kind: 'note'; text: string }
  | { kind: 'value'; prefix?: string; value: number; suffix?: string }

export type Product = {
  name: string
  href: string
  icon: string
  revenue: Revenue
}

export type Experience = {
  name: string
  /** Short role/company descriptor; absent for some rows (e.g. Raiffeisen) */
  description?: string
  period: string
  icon: string
  /** "What I did / achieved" text revealed when the card is expanded */
  blurb?: string
}

export type Social = {
  name: string
  href: string
  icon: string
}

export type CaseCard = {
  name: string
  /** My role on the project — right side of the card header */
  role: string
  icon: string
  /** Short description under the cover */
  text: string
  /** Composed HTML visual (see components/CaseVisuals); grey placeholder if absent */
  visual?: 'oversecured' | 'preplab'
}
