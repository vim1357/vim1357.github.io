import { useState } from 'react'
import { motion, useReducedMotion, type Transition } from 'motion/react'

const VIEWPORT = { once: true, margin: '-8% 0px' } as const

// beui project-folder spring (shared-layout glide).
const SPRING_LAYOUT: Transition = { type: 'spring', stiffness: 360, damping: 32 }

type Case = { id: string; label: string; bg: string; fg: string }

// 3 cards, coloured to match the brand icons already in /public/icons.
const cases: Case[] = [
  { id: 'cloud', label: 'Cloud.ru', bg: '#26D07C', fg: '#083b22' },
  { id: 'raif', label: 'Raiffeisen bank', bg: '#FFE200', fg: '#26282D' },
  { id: 'preplab', label: 'Preplab', bg: '#ffffff', fg: '#0a0a0a' },
]

/** Fan geometry — beui source, spread widened for the full-width (400px) box. */
function getPreviewTransform(index: number, count: number) {
  const offset = index - (count - 1) / 2
  const distance = Math.abs(offset)
  const centerLift = Math.max(0, 2 - distance) * 10
  return {
    x: offset * 76,
    y: 8 - centerLift,
    rotate: offset * 6,
    scale: distance === 0 ? 1.04 : distance === 1 ? 0.95 : 0.88,
    opacity: distance === 0 ? 1 : distance === 1 ? 0.78 : 0.58,
    zIndex: 10 - distance,
  }
}

/**
 * beui "project folder" ported to the site tokens: three stacked backdrop-blur
 * glass layers (back plate, fanning cards, front chrome). Opens the file fan on
 * hover / focus only — the click-to-expand overlay from the source is removed.
 */
export function ProjectFolder() {
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const transition: Transition = reduce ? { duration: 0 } : SPRING_LAYOUT

  return (
    // NB: no `filter` on any ancestor — a filter (even blur(0px), as motion's
    // Reveal leaves) disables backdrop-filter on descendants in Chrome/Safari,
    // which kills the folder's frosted glass. Entrance animates opacity/y only.
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={transition}
    >
      <div
        tabIndex={0}
        data-open={open ? 'true' : 'false'}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="relative block h-[240px] w-full select-none rounded-2xl text-left outline-none [perspective:1200px] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        {/* Back plate */}
        <motion.span
          aria-hidden
          animate={{ rotateX: open && !reduce ? 15 : 0 }}
          transition={transition}
          className="absolute inset-0 rounded-2xl border border-primary/10 bg-surface/40 backdrop-blur-2xl [transform-origin:center_bottom]"
        />

        {/* Fanning case cards */}
        <span aria-hidden className="pointer-events-none absolute inset-0">
          <span className="absolute left-1/2 top-0 block h-0 w-0">
            {cases.map((c, index) => {
              const o = getPreviewTransform(index, cases.length)
              return (
                <motion.span
                  key={c.id}
                  initial={false}
                  animate={
                    open && !reduce
                      ? {
                          x: o.x * 1.4,
                          y: o.y - 8,
                          rotate: o.rotate * 1.3,
                          scale: o.scale * 1.02,
                          opacity: Math.min(1, o.opacity + 0.18),
                        }
                      : { x: o.x, y: o.y, rotate: o.rotate, scale: o.scale, opacity: o.opacity }
                  }
                  transition={transition}
                  style={{ zIndex: o.zIndex }}
                  className="absolute left-0 top-0 -ml-14 block h-40 w-28 overflow-hidden rounded-lg border border-black/10 shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
                >
                  <span
                    className="flex h-full w-full items-start p-3"
                    style={{ backgroundColor: c.bg, color: c.fg }}
                  >
                    <span className="text-[13px] font-medium leading-4">{c.label}</span>
                  </span>
                </motion.span>
              )
            })}
          </span>
        </span>

        {/* Front chrome (glass) */}
        <motion.span
          initial={false}
          animate={{ rotateX: open && !reduce ? -25 : 0 }}
          transition={transition}
          className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-2xl border border-primary/12 bg-surface/55 backdrop-blur-[120px] [backface-visibility:hidden] [transform-origin:center_bottom]"
        >
          <span className="flex h-16 items-center px-4">
            <span className="line-clamp-2 text-xl font-bold leading-tight text-primary">
              Продуктовые и дизайн кейсы
            </span>
          </span>
          <span className="flex h-12 items-center justify-between gap-3 border-t border-primary/10 px-4">
            <span className="shrink-0 text-sm text-primary">Результаты и путь к ним</span>
            <span className="truncate text-sm text-muted">еще пишу</span>
          </span>
        </motion.span>
      </div>
    </motion.div>
  )
}
