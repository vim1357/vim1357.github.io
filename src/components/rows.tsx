import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { Contact, Experience, Product, Testimonial } from '../data/types'
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

/**
 * Contact button — surface or accent (Telegram-blue) variant.
 * With `caption`, the button sits in a lighter plate with the note below it.
 */
export function ContactButton({ item }: { item: Contact }) {
  if (!item.caption) return <ContactLink item={item} />
  return (
    <div className="flex flex-col overflow-hidden rounded-btn bg-surface-2">
      <ContactLink item={item} />
      <p className="px-4 py-2.5 text-sm leading-5 text-muted">{item.caption}</p>
    </div>
  )
}

function ContactLink({ item }: { item: Contact }) {
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

/**
 * Testimonial card — avatar + name/role header, then the quote.
 * Collapsed to 2 lines with an inline «показать» at the end of the 2nd line (see .quote-clamp).
 * Height springs open/closed like the experience accordion; the full text stays mounted
 * until the collapse finishes, then swaps back to the clamped version.
 */
export function FeedbackRow({ item }: { item: Testimonial }) {
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState(false)
  const reduce = useReducedMotion()
  const expand = () => {
    setFull(true)
    setOpen(true)
  }
  const toggle = 'cursor-pointer text-primary transition-opacity hover:opacity-70'
  return (
    <div className="flex flex-col bg-surface px-4 py-4">
      <div className="flex items-center gap-3">
        <AssetImg
          src={item.photo}
          alt={item.name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold leading-5 text-primary">{item.name}</span>
          <span className="truncate text-xs leading-4 text-muted">{item.role}</span>
        </div>
      </div>
      {item.relation && <p className="mt-3 text-xs leading-4 text-faint">{item.relation}</p>}
      <motion.div
        initial={false}
        animate={{ height: open ? 'auto' : 48 }}
        transition={reduce ? { duration: 0.15 } : { type: 'spring', duration: 0.5, bounce: 0.3 }}
        onAnimationComplete={() => {
          if (!open) setFull(false)
        }}
        className="mt-2"
        style={{ overflow: 'hidden' }}
      >
        {full ? (
          <p className="text-sm leading-6 text-muted">
            {item.quote}{' '}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-expanded={open}
              className={toggle}
            >
              Скрыть
            </button>
          </p>
        ) : (
          <div className="quote-clamp">
            <p className="text-sm leading-6 text-muted">
              <button
                type="button"
                onClick={expand}
                aria-expanded={false}
                className={`quote-toggle pl-1 ${toggle}`}
              >
                <span className="text-muted">… </span>показать
              </button>
              {item.quote}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  )
}
