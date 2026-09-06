export type SectionMeta = { title: string; subtitle?: string }

export type Contact = {
  label: string
  href: string
  icon: string
  /** Telegram-blue highlighted button */
  accent?: boolean
}

export type Product = {
  name: string
  href: string
  icon: string
  /** Right-side value, e.g. "+700k ₽" or "Выручка — пока тайна" */
  revenue: string
  /** true → green revenue number; false → muted note */
  revenueGreen: boolean
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
