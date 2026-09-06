import { motion } from 'motion/react'
import type { Contact, Experience, Product } from '../data/types'
import { socials } from '../data/socials'
import { AssetImg, ArrowUpRight } from './primitives'
import { Stagger, TextReveal } from './motion'

const isExternal = (href: string) => /^https?:/.test(href)

function extAttrs(href: string) {
  return isExternal(href)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {}
}

/** Product row — whole row is a link. Icon + name … revenue. */
export function ProductRow({ item }: { item: Product }) {
  return (
    <motion.a
      href={item.href}
      {...extAttrs(item.href)}
      whileTap={{ scale: 0.985 }}
      className="flex items-center justify-between gap-3 bg-surface px-4 py-4 transition-colors hover:bg-surface-2"
    >
      <span className="flex min-w-0 items-center gap-2">
        <AssetImg src={item.icon} className="h-5 w-5 shrink-0 rounded-[4px] object-contain" />
        <span className="truncate text-sm leading-5 text-primary">{item.name}</span>
      </span>
      <TextReveal
        text={item.revenue}
        className={`shrink-0 text-sm leading-5 ${item.revenueGreen ? 'text-revenue' : 'text-muted'}`}
      />
    </motion.a>
  )
}

/** Experience row — static (not a link). Icon + name | description … period. */
export function ExperienceRow({ item }: { item: Experience }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-surface px-4 py-4">
      <span className="flex min-w-0 items-center gap-2">
        <AssetImg src={item.icon} className="h-5 w-5 shrink-0 rounded-[4px] object-contain" />
        <span className="shrink-0 text-sm leading-5 text-primary">{item.name}</span>
        {item.description && (
          <>
            <span className="h-5 w-px shrink-0 bg-line" aria-hidden />
            <span className="truncate text-xs leading-4 text-faint">{item.description}</span>
          </>
        )}
      </span>
      <span className="shrink-0 text-sm leading-5 text-muted">{item.period}</span>
    </div>
  )
}

/** Contact button — surface or accent (Telegram-blue) variant. */
export function ContactButton({ item }: { item: Contact }) {
  return (
    <motion.a
      href={item.href}
      {...extAttrs(item.href)}
      whileTap={{ scale: 0.99 }}
      className={`group flex items-center justify-between gap-2 rounded-btn px-4 py-[10px] transition-colors ${
        item.accent
          ? 'bg-accent text-white hover:brightness-95'
          : 'bg-surface text-primary hover:bg-surface-2'
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <AssetImg src={item.icon} className="h-6 w-6 shrink-0 object-contain" />
        <span className="truncate text-sm leading-5">{item.label}</span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </motion.a>
  )
}

/** Row of social icon links. */
export function Socials() {
  return (
    <Stagger className="flex flex-wrap gap-3" stagger={0.06} y={12}>
      {socials.map((s) => (
        <motion.a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={s.name}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="inline-block"
        >
          <AssetImg src={s.icon} alt={s.name} className="h-8 w-8 rounded-[8px] object-contain" />
        </motion.a>
      ))}
    </Stagger>
  )
}
