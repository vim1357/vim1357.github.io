import type { CSSProperties, ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { CaseCard } from '../data/types'

/**
 * Case cover visuals, composed from HTML "interface blocks" (refs: floating
 * widgets around a central card). Each is laid out on a fixed 360×180 stage
 * that is scaled down to the card width, centred between the card header and
 * its copy. Neutral parts use theme tokens (bg-widget, text-primary…), brand
 * parts keep brand colours, so both themes work.
 */

const STAGE_W = 360
const STAGE_H = 180

type VisualProps = { open: boolean }

export function CaseVisual({
  id,
  open,
  stageTop,
  stageHeight,
  width,
}: {
  id: CaseCard['visual']
  open: boolean
  stageTop: number
  stageHeight: number
  width: number
}) {
  if (!id) {
    return (
      <div
        className="absolute inset-x-2 rounded-[12px] bg-placeholder"
        style={{ top: stageTop, height: stageHeight }}
      />
    )
  }
  const Visual = visuals[id]
  const scale = Math.min(1, (width - 16) / STAGE_W)
  return (
    <div
      className="absolute left-1/2"
      style={{
        top: stageTop + (stageHeight - STAGE_H * scale) / 2,
        width: STAGE_W,
        height: STAGE_H,
        marginLeft: -STAGE_W / 2,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      <Visual open={open} />
    </div>
  )
}

/* ───────────── shared motion bits ───────────── */

/** Stage root: staggers its <Item>s in every time the card opens. */
function Stage({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0"
      initial="hide"
      animate={open ? 'show' : 'hide'}
      variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } }, hide: {} }}
    >
      {children}
    </motion.div>
  )
}

type From = { x?: number; y?: number; rotate?: number }

/**
 * A block that pops into place (from offset → its resting rotate) and then floats.
 * `className`/`style` position it on the stage; `box` styles the block itself, so
 * the whole block floats — not just its content inside a still frame.
 */
function Item({
  open,
  i = 0,
  rotate = 0,
  from = { y: 12 },
  float = true,
  className,
  style,
  box,
  children,
}: {
  open: boolean
  i?: number
  rotate?: number
  from?: From
  float?: boolean
  className?: string
  style?: CSSProperties
  box?: string
  children: ReactNode
}) {
  const reduce = useReducedMotion()
  const rest = { opacity: 1, x: 0, y: 0, scale: 1, rotate }
  const variants: Variants = reduce
    ? { hide: rest, show: rest }
    : {
        // Reset only after the card has faded out, so it replays on next open.
        hide: {
          opacity: 0,
          x: from.x ?? 0,
          y: from.y ?? 0,
          scale: 0.94,
          rotate: from.rotate ?? rotate,
          transition: { duration: 0, delay: 0.35 },
        },
        show: { ...rest, transition: { type: 'spring', stiffness: 260, damping: 24 } },
      }
  const floating = float && open && !reduce
  return (
    <motion.div variants={variants} className={`absolute ${className ?? ''}`} style={style}>
      <motion.div
        className={box}
        animate={floating ? { y: [0, -3, 0] } : { y: 0 }}
        transition={
          floating
            ? { duration: 3.6 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }
            : { duration: 0.3 }
        }
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

const WIDGET =
  'rounded-[12px] border border-primary/8 bg-widget'

/* ───────────── Oversecured ───────────── */

const OS_BLUE = '#0154FA'
const SEVERITY = [
  { n: 52, label: 'High severity', note: 'Serious violation', color: '#E5484D', share: 0.72 },
  { n: 34, label: 'Medium severity', note: 'Reduce the level', color: '#F5A524', share: 0.48 },
  { n: 103, label: 'Low severity', note: 'Violate best practices', color: '#30A46C', share: 0.88 },
]

function SeverityRing({ n, color, share, open }: { n: number; color: string; share: number; open: boolean }) {
  const reduce = useReducedMotion()
  return (
    <span className="relative grid h-[26px] w-[26px] shrink-0 place-items-center">
      <svg viewBox="0 0 26 26" className="absolute inset-0 -rotate-90">
        <circle cx="13" cy="13" r="10.5" fill="none" strokeWidth="2.5" className="stroke-primary/10" />
        <motion.circle
          cx="13"
          cy="13"
          r="10.5"
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? share : 0 }}
          animate={{ pathLength: open || reduce ? share : 0 }}
          transition={reduce ? { duration: 0 } : { duration: 0.9, delay: open ? 0.45 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="text-[8px] font-bold text-primary">{n}</span>
    </span>
  )
}

function Oversecured({ open }: VisualProps) {
  return (
    <Stage open={open}>
      {/* Backdrop: concentric rings, bleeding past the stage. */}
      <svg
        viewBox="0 0 440 440"
        className="absolute left-[-40px] top-[-130px] h-[440px] w-[440px] text-primary opacity-[0.07]"
        fill="none"
      >
        {[70, 120, 170, 220].map((r) => (
          <circle key={r} cx="220" cy="220" r={r} stroke="currentColor" />
        ))}
      </svg>

      {/* Central scan report */}
      <Item open={open} i={0} float={false} className="left-[66px] top-[18px]" box={`w-[168px] p-3 ${WIDGET}`}>
        <p className="text-[11px] font-semibold leading-[14px] text-primary">Scan Report v1.4.0</p>
        <p className="mt-0.5 text-[8px] leading-[10px] text-muted">Latest · 29.04.2026 10:31 CET</p>
        <span
          className="mt-2 inline-block rounded-full px-2 py-1 text-[8.5px] font-medium leading-[10px] text-white"
          style={{ background: OS_BLUE }}
        >
          189 vulnerabilities found
        </span>
        <div className="mt-2.5 flex flex-col gap-1.5">
          {['100%', '84%', '92%', '68%'].map((w) => (
            <span key={w} className="block h-[9px] rounded-full bg-primary/8" style={{ width: w }} />
          ))}
        </div>
      </Item>

      {/* Severity breakdown, stacked over the report's right edge */}
      {SEVERITY.map((s, k) => (
        <Item
          key={s.label}
          open={open}
          i={k + 1}
          from={{ x: 18 }}
          className="left-[206px]"
          style={{ top: 27 + k * 41 }}
          box={`flex h-[38px] w-[138px] items-center gap-2 px-2 ${WIDGET}`}
        >
          <span className="flex items-center gap-2">
            <SeverityRing n={s.n} color={s.color} share={s.share} open={open} />
            <span className="flex flex-col">
              <span className="text-[9px] font-semibold leading-[11px] text-primary">{s.label}</span>
              <span className="text-[7.5px] leading-[10px] text-muted">{s.note}</span>
            </span>
          </span>
        </Item>
      ))}

      {/* Agentic findings chip */}
      <Item
        open={open}
        i={4}
        from={{ x: -14 }}
        className="left-[2px] top-[94px]"
        box={`!rounded-full px-2.5 py-1.5 ${WIDGET}`}
      >
        <span className="flex items-center gap-1.5 whitespace-nowrap text-[9.5px] font-medium leading-3 text-primary">
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill={OS_BLUE} aria-hidden>
            <path d="M6 0c.4 2.9 1.9 4.6 6 6-4.1 1.4-5.6 3.1-6 6-.4-2.9-1.9-4.6-6-6 4.1-1.4 5.6-3.1 6-6Z" />
          </svg>
          Agentic Findings
        </span>
      </Item>

    </Stage>
  )
}

/* ───────────── Preplab ───────────── */

const PP_YELLOW = '#FFE266'
const PP_INK = '#191919'
const WAVE = [6, 11, 16, 9, 14, 18, 10, 13, 7]

/** Preplab mark: speech bubble with two eyes. */
function PreplabMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <path
        d="M20 40C31.05 40 40 31.05 40 20S31.05 0 20 0 0 8.95 0 20v16.67C0 38.51 1.49 40 3.33 40H20Z"
        fill={PP_INK}
      />
      <circle cx="13.33" cy="20" r="3.33" fill={PP_YELLOW} />
      <circle cx="26.67" cy="20" r="3.33" fill={PP_YELLOW} />
    </svg>
  )
}

function QuestionCard({ title, body, bg, ink }: { title: string; body: string; bg: string; ink: string }) {
  return (
    <div
      className="relative rounded-[12px] px-2.5 pb-3 pt-4 text-center"
      style={{ background: bg }}
    >
      <span className="absolute left-1/2 top-[6px] h-[6px] w-[6px] -translate-x-1/2 rounded-full" style={{ background: PP_INK }} />
      <p className="text-[10px] font-semibold leading-3" style={{ color: PP_INK }}>
        {title}
      </p>
      <p className="mt-1.5 text-[8px] leading-[11px]" style={{ color: ink }}>
        {body}
      </p>
    </div>
  )
}

function Preplab({ open }: VisualProps) {
  const reduce = useReducedMotion()
  const live = open && !reduce
  return (
    <Stage open={open}>
      {/* Backdrop: dot grid fading out from the centre */}
      <div
        className="absolute left-[-220px] top-[-140px] h-[460px] w-[800px] text-primary opacity-[0.16]"
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1.3px)',
          backgroundSize: '14px 14px',
          maskImage: 'radial-gradient(ellipse 45% 50% at center, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 45% 50% at center, black 30%, transparent 75%)',
        }}
      />

      {/* Role question cards, like the hanging cards on preplab.ru */}
      <Item open={open} i={1} rotate={-7} from={{ x: -16, rotate: 0 }} className="left-[16px] top-[38px] w-[110px]">
        <QuestionCard
          title="Продакт-менеджер"
          body="Ключевая метрика за неделю упала на 10%. С чего начнёшь?"
          bg="#FFF1A8"
          ink="#8a6a00"
        />
      </Item>
      <Item open={open} i={2} rotate={6} from={{ x: 16, rotate: 0 }} className="left-[234px] top-[44px] w-[110px]">
        <QuestionCard
          title="Дизайнер"
          body="Какой твой идеальный дизайн-процесс? Насколько он расходится с текущим?"
          bg="#FFE1CC"
          ink="#b4532a"
        />
      </Item>

      {/* Voice interviewer — always dark, like the call card on preplab.ru */}
      <Item
        open={open}
        i={0}
        float={false}
        className="left-[112px] top-[22px]"
        box="flex w-[136px] flex-col items-center rounded-[16px] border border-white/10 bg-[#111] px-3 pb-3 pt-2.5"
      >
        <div className="flex flex-col items-center">
          <span className="relative grid h-[58px] w-[58px] place-items-center">
            <motion.svg
              viewBox="0 0 58 58"
              className="absolute inset-0"
              animate={live ? { rotate: 360 } : { rotate: 0 }}
              transition={live ? { duration: 14, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
            >
              <circle cx="29" cy="29" r="27" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeDasharray="0 5.6" />
            </motion.svg>
            <span className="grid h-[42px] w-[42px] place-items-center rounded-full" style={{ background: PP_YELLOW }}>
              <PreplabMark className="h-[20px] w-[20px]" />
            </span>
          </span>
          <p className="mt-1.5 text-[11px] font-medium leading-[13px] text-white">Лера</p>
          <p className="text-[8px] leading-[10px] text-white/50">ИИ-интервьюер</p>

          <span className="mt-2 flex h-[18px] items-center gap-[2.5px]">
            {WAVE.map((h, k) => (
              <motion.span
                key={k}
                className="block w-[2.5px] rounded-full"
                style={{ background: PP_YELLOW }}
                initial={{ height: h }}
                animate={live ? { height: [h * 0.35, h, h * 0.55, h * 0.9, h * 0.35] } : { height: h * 0.6 }}
                transition={
                  live ? { duration: 1.1 + (k % 4) * 0.15, repeat: Infinity, ease: 'easeInOut', delay: k * 0.05 } : { duration: 0.3 }
                }
              />
            ))}
          </span>

        </div>
      </Item>

    </Stage>
  )
}

const visuals: Record<NonNullable<CaseCard['visual']>, (p: VisualProps) => ReactNode> = {
  oversecured: Oversecured,
  preplab: Preplab,
}
