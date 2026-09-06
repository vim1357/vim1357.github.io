import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Contact, Experience, Product } from '../data/types'
import { socials } from '../data/socials'
import { AssetImg, ArrowUpRight } from './primitives'
import { Stagger, TextReveal } from './motion'
import { AnimatedNumber } from './AnimatedNumber'

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
      <Revenue revenue={item.revenue} />
    </motion.a>
  )
}

/** Right-side revenue: muted note, or a green count-up number with prefix/suffix. */
function Revenue({ revenue }: { revenue: Product['revenue'] }) {
  if (revenue.kind === 'note') {
    return <TextReveal text={revenue.text} className="shrink-0 text-sm leading-5 text-muted" />
  }
  return (
    <span className="shrink-0 whitespace-nowrap text-sm leading-5 text-revenue">
      {revenue.prefix}
      <AnimatedNumber value={revenue.value} />
      {revenue.suffix}
    </span>
  )
}

/**
 * Experience card — accordion. Default look is unchanged (no chevron/affordance);
 * hover highlights the card, click expands to reveal `blurb` with a bouncy
 * spring height + blur/opacity reveal (beui bouncy-accordion).
 */
export function ExperienceRow({ item }: { item: Experience }) {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const hasBlurb = Boolean(item.blurb)

  const toggle = () => hasBlurb && setOpen((v) => !v)

  return (
    <div
      role={hasBlurb ? 'button' : undefined}
      tabIndex={hasBlurb ? 0 : undefined}
      aria-expanded={hasBlurb ? open : undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (hasBlurb && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          toggle()
        }
      }}
      className={`bg-surface px-4 py-4 transition-colors ${
        hasBlurb ? 'cursor-pointer hover:bg-surface-2' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
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

      <AnimatePresence initial={false}>
        {open && item.blurb && (
          <motion.div
            key="blurb"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: 'spring', duration: 0.5, bounce: 0.3 }
            }
            style={{ overflow: 'hidden' }}
          >
            <motion.p
              initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(4px)' }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="whitespace-pre-line pt-3 text-sm leading-5 text-muted"
            >
              {item.blurb}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
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
        <span className="truncate text-sm leading-5">
          {item.label}
          {item.note && <span className="text-muted"> {item.note}</span>}
        </span>
      </span>
      <ArrowUpRight className="h-5 w-5 shrink-0 transition-transform duration-200 ease-out group-hover:rotate-45" />
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
