import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { motion, useInView, useReducedMotion, type Transition } from 'motion/react'
import { cases } from '../data/cases'
import { AssetImg } from './primitives'
import { CaseVisual } from './CaseVisuals'

const VIEWPORT = { once: true, margin: '-8% 0px' } as const
const SPRING: Transition = { type: 'spring', stiffness: 220, damping: 30, mass: 1 }
const INTERVAL = 3000

// Geometry (px). Collapsed card = header only; expanded = header + cover + text.
const HEADER = 52
const COVER = 180
const LINE = 20
const GAP = 8
// Copy gets as many lines as it needs at the current width (2–3), per card.
const MIN_LINES = 2
const MAX_LINES = 3

const bodyFor = (lines: number) => HEADER + COVER + 12 + lines * LINE + 16

/** Live content width of an element (for scaling the fixed-size visuals). */
function useWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(400)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return width
}

/** Signed distance from the active card, wrapped into -⌊n/2⌋…⌊n/2⌋. */
function offsetOf(index: number, active: number, count: number) {
  let o = (((index - active) % count) + count) % count
  if (o > count / 2) o -= count
  return o
}

/** Slot for a card at a given offset: -1 above, 0 open, +1 below, |2+| hidden. */
function slot(offset: number, body: number, height: number) {
  if (offset === 0) return { y: HEADER + GAP, height: body, scale: 1, opacity: 1, zIndex: 3 }
  if (offset === -1) return { y: 0, height: HEADER, scale: 0.92, opacity: 0.7, zIndex: 2 }
  if (offset === 1)
    return { y: HEADER + GAP + body + GAP, height: HEADER, scale: 0.92, opacity: 0.7, zIndex: 2 }
  // Off-stage: tucked behind the neighbour on its side, fully transparent.
  return offset < 0
    ? { y: -HEADER / 2, height: HEADER, scale: 0.84, opacity: 0, zIndex: 1 }
    : { y: height - HEADER / 2, height: HEADER, scale: 0.84, opacity: 0, zIndex: 1 }
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
  const width = useWidth(ref)
  const textRefs = useRef<(HTMLParagraphElement | null)[]>([])
  const [lines, setLines] = useState<number[]>(() => cases.map(() => MIN_LINES))
  // The stage keeps the tallest card's height, so the page below never jumps.
  const height = HEADER + GAP + bodyFor(Math.max(...lines)) + GAP + HEADER
  const activeBody = bodyFor(lines[active])

  // scrollHeight reports the full copy height even while it's line-clamped.
  useLayoutEffect(() => {
    const measure = () =>
      setLines(
        textRefs.current.map((p) =>
          p ? Math.min(MAX_LINES, Math.max(MIN_LINES, Math.round(p.scrollHeight / LINE))) : MIN_LINES,
        ),
      )
    measure()
    document.fonts?.ready.then(measure)
  }, [width])
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
      style={{ height }}
    >
      {cases.map((c, i) => {
        const offset = offsetOf(i, active, cases.length)
        const s = slot(offset, activeBody, height)
        const body = bodyFor(lines[i])
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
            {/* Visual fills the whole open card; header and copy sit on top of it. */}
            <motion.div
              aria-hidden
              initial={false}
              animate={{ opacity: open ? 1 : 0 }}
              transition={reduce ? { duration: 0 } : { duration: 0.3, delay: open ? 0.08 : 0 }}
              className="pointer-events-none absolute inset-x-0 top-0"
              style={{ height: body }}
            >
              <CaseVisual id={c.visual} open={open} stageTop={HEADER} stageHeight={COVER} width={width} />
              {/* Fades so the visual never fights the header and copy. */}
              <div className="absolute inset-x-0 top-0 h-16 bg-linear-to-b from-surface to-transparent" />
              <div
                className="absolute inset-x-0 bottom-0 bg-linear-to-t from-surface from-55% to-transparent"
                style={{ height: body - HEADER - COVER + 28 }}
              />
            </motion.div>

            <div
              className="relative flex items-center justify-between gap-3 px-4"
              style={{ height: HEADER }}
            >
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
              className="absolute inset-x-0 px-4 pb-4 pt-3"
              style={{ top: HEADER + COVER }}
            >
              <p
                ref={(el) => {
                  textRefs.current[i] = el
                }}
                className="overflow-hidden text-sm leading-5 text-muted [display:-webkit-box] [-webkit-box-orient:vertical]"
                style={{ WebkitLineClamp: lines[i] }}
              >
                {c.text}
              </p>
            </motion.div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
