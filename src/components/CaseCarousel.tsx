import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, type Transition } from 'motion/react'
import { cases } from '../data/cases'
import { AssetImg } from './primitives'

const VIEWPORT = { once: true, margin: '-8% 0px' } as const
const SPRING: Transition = { type: 'spring', stiffness: 220, damping: 30, mass: 1 }
const INTERVAL = 3000

// Geometry (px). Collapsed card = header only; expanded = header + cover + text.
const HEADER = 52
const COVER = 180
const BODY = HEADER + COVER + 12 + 40 + 16
const GAP = 8
const HEIGHT = HEADER + GAP + BODY + GAP + HEADER

/** Signed distance from the active card, wrapped into -⌊n/2⌋…⌊n/2⌋. */
function offsetOf(index: number, active: number, count: number) {
  let o = (((index - active) % count) + count) % count
  if (o > count / 2) o -= count
  return o
}

/** Slot for a card at a given offset: -1 above, 0 open, +1 below, |2+| hidden. */
function slot(offset: number) {
  if (offset === 0) return { y: HEADER + GAP, height: BODY, scale: 1, opacity: 1, zIndex: 3 }
  if (offset === -1) return { y: 0, height: HEADER, scale: 0.92, opacity: 0.7, zIndex: 2 }
  if (offset === 1)
    return { y: HEADER + GAP + BODY + GAP, height: HEADER, scale: 0.92, opacity: 0.7, zIndex: 2 }
  // Off-stage: tucked behind the neighbour on its side, fully transparent.
  return offset < 0
    ? { y: -HEADER / 2, height: HEADER, scale: 0.84, opacity: 0, zIndex: 1 }
    : { y: HEIGHT - HEADER / 2, height: HEADER, scale: 0.84, opacity: 0, zIndex: 1 }
}

/**
 * Vertical case rolodex (ref: Diagnosync widgets). One card is open in the
 * middle, its neighbours sit above and below as collapsed headers; every 3 s
 * the stack rolls up. Hover pauses it, clicking a header opens that card.
 */
export function CaseCarousel() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { margin: '-10% 0px' })
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const transition: Transition = reduce ? { duration: 0 } : SPRING

  // Re-armed on every change of `active`, so a click restarts the 3 s wait.
  useEffect(() => {
    if (reduce || hover || !inView) return
    const id = window.setTimeout(() => setActive((a) => (a + 1) % cases.length), INTERVAL)
    return () => window.clearTimeout(id)
  }, [active, hover, inView, reduce])

  return (
    <motion.div
      ref={ref}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={transition}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      className="relative w-full"
      style={{ height: HEIGHT }}
    >
      {cases.map((c, i) => {
        const offset = offsetOf(i, active, cases.length)
        const s = slot(offset)
        const open = offset === 0
        const visible = Math.abs(offset) <= 1
        const select = () => !open && setActive(i)
        return (
          <motion.div
            key={c.name}
            initial={false}
            animate={{ y: s.y, height: s.height, scale: s.scale, opacity: s.opacity }}
            transition={transition}
            style={{ zIndex: s.zIndex }}
            aria-hidden={!visible}
            role={visible && !open ? 'button' : undefined}
            tabIndex={visible && !open ? 0 : undefined}
            aria-label={visible && !open ? c.name : undefined}
            onClick={select}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                select()
              }
            }}
            className={`absolute inset-x-0 top-0 overflow-hidden rounded-card bg-surface outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              visible ? '' : 'pointer-events-none'
            } ${open ? '' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between gap-3 px-4" style={{ height: HEADER }}>
              <span className="flex min-w-0 items-center gap-2">
                <AssetImg src={c.icon} className="h-5 w-5 shrink-0 rounded-[4px] object-contain" />
                <span className="truncate text-sm leading-5 text-primary">{c.name}</span>
              </span>
              <span className="shrink-0 text-xs leading-4 text-muted">{c.role}</span>
            </div>

            <motion.div
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.25, delay: open ? 0.1 : 0 }}
            >
              <div className="mx-2 rounded-[12px] bg-placeholder" style={{ height: COVER }} />
              <div className="px-4 pb-4 pt-3">
                <p className="line-clamp-2 text-sm leading-5 text-muted">{c.text}</p>
              </div>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
