export type SectionMeta = { title: string; subtitle?: string }

export type Contact = {
  label: string
  href: string
  icon: string
  /** Telegram-blue highlighted button */
  accent?: boolean
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
}

export type Social = {
  name: string
  href: string
  icon: string
}
