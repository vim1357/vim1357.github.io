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

/* ───────────── shared backdrop ───────────── */

/** Faint pattern that fills the card and fades out towards the edges. */
function Backdrop({ image, size, opacity = 0.12 }: { image: string; size: string; opacity?: number }) {
  const mask = 'radial-gradient(ellipse 45% 50% at center, black 30%, transparent 75%)'
  return (
    <div
      className="absolute left-[-220px] top-[-140px] h-[460px] w-[800px] text-primary"
      style={{ opacity, backgroundImage: image, backgroundSize: size, maskImage: mask, WebkitMaskImage: mask }}
    />
  )
}

const NBSP = ' '

/* ───────────── Cloud.ru ───────────── */

const CLOUD_GREEN = '#26D07C'
const CLOUD_RED = '#F0575F'
const RESOURCES = [{ label: 'Виртуальные машины', used: '900', total: '1000 шт.', share: 0.9, color: CLOUD_RED }]

function HealthGauge({ open }: { open: boolean }) {
  const reduce = useReducedMotion()
  const ARC = 2 / 3 // 240° gauge, gap at the bottom
  const score = 0.89
  const full = `${ARC * score} 1`
  return (
    <span className="relative mx-auto mt-1 block h-[84px] w-[96px]">
      <svg viewBox="0 0 100 100" className="absolute inset-x-0 top-0 h-[96px] w-[96px] rotate-[150deg]">
        <circle cx="50" cy="50" r="40" fill="none" strokeWidth="9" strokeLinecap="round" pathLength={1} strokeDasharray={`${ARC} 1`} className="stroke-primary/8" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={CLOUD_GREEN}
          strokeWidth="9"
          strokeLinecap="round"
          pathLength={1}
          initial={{ strokeDasharray: reduce ? full : '0 1' }}
          animate={{ strokeDasharray: open || reduce ? full : '0 1' }}
          transition={reduce ? { duration: 0 } : { duration: 1.1, delay: open ? 0.4 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <span className="absolute inset-x-0 top-[30px] flex flex-col items-center">
        <span className="text-[7.5px] leading-[9px] text-muted">оценка</span>
        <span className="text-[18px] font-semibold leading-[22px] text-primary">89</span>
      </span>
    </span>
  )
}

function Cloud({ open }: VisualProps) {
  const reduce = useReducedMotion()
  return (
    <Stage open={open}>
      <Backdrop
        image="linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)"
        size="22px 22px"
        opacity={0.045}
      />

      {/* System health gauge */}
      <Item open={open} i={0} float={false} className="left-[171px] top-[16px]" box={`h-[134px] w-[156px] px-3 pb-3 pt-2.5 ${WIDGET}`}>
        <p className="text-[10px] font-semibold leading-3 text-primary">Здоровье систем</p>
        <HealthGauge open={open} />
        <p className="text-center text-[8px] leading-[10px] text-muted">Все системы в{NBSP}порядке</p>
      </Item>

      {/* Used resources — stacked left of the gauge, bottom-aligned with it (10px gaps) */}
      {RESOURCES.map((r, k) => (
        <Item
          key={r.label}
          open={open}
          i={k + 1}
          from={{ x: -16 }}
          float={false}
          className="right-[199px]"
          style={{ top: 97 + k * 60 }}
          box={`h-[53px] w-[128px] px-2.5 py-2 ${WIDGET}`}
        >
          <p className="text-[8px] leading-[10px] text-muted">{r.label}</p>
          <p className="mt-1 flex items-baseline justify-between text-[10px] leading-3">
            <span className="text-primary">
              <span className="font-semibold">{r.used}</span>
              <span className="text-muted"> / {r.total}</span>
            </span>
            <span className="font-semibold text-primary">{Math.round(r.share * 100)}%</span>
          </p>
          <span className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-primary/8">
            <motion.span
              className="block h-full rounded-full"
              style={{ background: r.color }}
              initial={{ width: reduce ? `${r.share * 100}%` : '0%' }}
              animate={{ width: open || reduce ? `${r.share * 100}%` : '0%' }}
              transition={reduce ? { duration: 0 } : { duration: 0.9, delay: open ? 0.5 + k * 0.1 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            />
          </span>
        </Item>
      ))}

      {/* Balance — top-aligned with the gauge, sharing the stack's right edge */}
      <Item open={open} i={3} from={{ x: -16 }} float={false} className="right-[199px] top-[16px]" box={`h-[71px] whitespace-nowrap px-2.5 py-2 ${WIDGET}`}>
        <p className="flex items-center gap-1 text-[8px] leading-[10px] text-muted">
          Баланс
          <span className="grid h-[9px] w-[9px] place-items-center rounded-full text-[8px] leading-none text-white" style={{ background: CLOUD_GREEN }}>
            +
          </span>
        </p>
        <p className="mt-0.5 text-[13px] font-semibold leading-4 text-primary">20{NBSP}345{NBSP}₽</p>
        <span
          className="mt-1 inline-block rounded-[4px] px-1.5 py-[1px] text-[8px] leading-[11px]"
          style={{ background: 'rgba(38, 208, 124, 0.14)', color: '#13a861' }}
        >
          ≈ 18 дней
        </span>
      </Item>

    </Stage>
  )
}

/* ───────────── 2PR ───────────── */

const PR_BLUE = '#1A5CFF'
// Engagement Jan → Dec, 5.2k → 8.4k (as on the 2PR recap page)
const ENGAGEMENT = [5.2, 5.24, 5.3, 5.38, 5.5, 5.64, 5.8, 6.04, 6.38, 6.84, 7.5, 8.4]

function engagementPath(w: number, h: number) {
  const min = 5
  const max = 8.6
  const pts = ENGAGEMENT.map((v, k) => [(k / (ENGAGEMENT.length - 1)) * w, h - ((v - min) / (max - min)) * h])
  const line = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return { line, area: `${line} L${w} ${h} L0 ${h} Z`, end: pts[pts.length - 1] }
}

function EngagementChart({ open }: { open: boolean }) {
  const reduce = useReducedMotion()
  const W = 176
  const H = 52
  const { line, area, end } = engagementPath(W, H)
  return (
    <svg viewBox={`0 0 ${W} ${H + 2}`} className="mt-1 block h-[54px] w-[176px] overflow-visible">
      <defs>
        <linearGradient id="pr-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={PR_BLUE} stopOpacity="0.28" />
          <stop offset="100%" stopColor={PR_BLUE} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill="url(#pr-area)"
        initial={{ opacity: reduce ? 1 : 0 }}
        animate={{ opacity: open || reduce ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 0.6, delay: open ? 0.9 : 0.35 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={PR_BLUE}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: open || reduce ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { duration: 1.1, delay: open ? 0.35 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx={end[0]}
        cy={end[1]}
        r="2.6"
        fill="white"
        stroke={PR_BLUE}
        strokeWidth="1.4"
        initial={{ scale: reduce ? 1 : 0 }}
        animate={{ scale: open || reduce ? 1 : 0 }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 20, delay: open ? 1.35 : 0.35 }}
      />
    </svg>
  )
}

const PR_STATS = [{ label: 'Likes', value: '265', delta: '+167' }]

function Pr({ open }: VisualProps) {
  return (
    <Stage open={open}>
      <Backdrop image="linear-gradient(currentColor 1px, transparent 1px)" size="100% 24px" opacity={0.06} />

      {/* Engagement recap */}
      <Item open={open} i={0} float={false} className="left-[92px] top-[24px]" box={`w-[200px] px-3 pb-2.5 pt-2.5 ${WIDGET}`}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold leading-3 text-primary">
            <span className="grid h-[14px] w-[14px] place-items-center rounded-full" style={{ background: PR_BLUE }}>
              <svg viewBox="0 0 10 10" className="h-[8px] w-[8px]" fill="white" aria-hidden>
                <circle cx="5" cy="3.2" r="1.9" />
                <path d="M1.4 9c.3-2 1.8-3.2 3.6-3.2S8.3 7 8.6 9Z" />
              </svg>
            </span>
            Engagement
          </span>
          <span className="flex items-baseline gap-1 text-[8px] leading-[10px] text-muted">
            5.2k → <span className="text-[10px] font-semibold text-primary">8.4k</span>
          </span>
        </div>
        <EngagementChart open={open} />
      </Item>

      {/* Product Hunt badge */}
      <Item open={open} i={1} from={{ y: -10 }} className="left-[30px] top-[104px]" box={`flex items-center gap-2 px-2.5 py-1.5 ${WIDGET}`}>
        <span className="flex items-center gap-2">
          <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[#F5B83D] text-[9px] font-bold leading-none text-white">1</span>
          <span className="flex flex-col">
            <span className="text-[6.5px] font-semibold uppercase leading-[8px] tracking-wide text-muted">Product Hunt</span>
            <span className="text-[9px] font-semibold leading-[11px] text-primary">#1 Product of the Day</span>
          </span>
        </span>
      </Item>

      {/* Year stats */}
      {PR_STATS.map((s, k) => (
        <Item
          key={s.label}
          open={open}
          i={k + 2}
          from={{ x: 16 }}
          className="left-[266px]"
          style={{ top: 92 + k * 54 }}
          box={`w-[64px] px-2.5 py-2 ${WIDGET}`}
        >
          <p className="text-[8px] leading-[10px] text-muted">{s.label}</p>
          <p className="mt-0.5 text-[14px] font-semibold leading-[17px] text-primary">{s.value}</p>
          <p className="text-[7.5px] leading-[9px] text-[#1DAF5F]">{s.delta}</p>
        </Item>
      ))}

    </Stage>
  )
}

/* ───────────── Raiffeisen ───────────── */

const RAIF_YELLOW = '#FEE600'
const RAIF_INK = '#2B2D33'
const RAIF_LINK = '#4A64D8'
const SPACES = ['Архитектурный репозиторий', 'Agile', 'Buddy school']
const RESOURCES_LINKS = [
  { name: 'Сервис-деск', bg: RAIF_YELLOW, mark: '✱' },
  { name: 'Confluence', bg: '#2684FF', mark: 'C' },
  { name: 'R-info', bg: RAIF_YELLOW, mark: 'R' },
]

function Raif({ open }: VisualProps) {
  return (
    <Stage open={open}>
      <Backdrop
        image="radial-gradient(currentColor 1px, transparent 1.3px)"
        size="10px 10px"
      />

      {/* Knowledge base home */}
      <Item open={open} i={0} float={false} className="left-[52px] top-[6px]" box={`w-[172px] p-2.5 ${WIDGET}`}>
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-bold leading-[14px] text-primary">База знаний</span>
          <span className="rounded-[4px] bg-[#F6DDC8] px-1 py-[1px] text-[6.5px] leading-[9px]" style={{ color: RAIF_INK }}>
            Первая версия
          </span>
        </div>
        <div className="mt-2 flex h-[20px] items-center gap-1.5 rounded-[6px] border border-primary/10 px-1.5">
          <svg viewBox="0 0 10 10" className="h-[8px] w-[8px] text-muted" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
            <circle cx="4.3" cy="4.3" r="3" />
            <path d="m6.6 6.6 2.2 2.2" strokeLinecap="round" />
          </svg>
          <span className="text-[8px] leading-[10px] text-muted">Название пространства</span>
        </div>
        <div className="mt-1.5 flex flex-col gap-1">
          {SPACES.map((name, k) => (
            <div
              key={name}
              className={`flex h-[24px] items-center gap-2 rounded-[6px] px-1.5 ${k === SPACES.length - 1 ? 'bg-primary/6' : ''}`}
            >
              <span className="grid h-[16px] w-[16px] place-items-center rounded-[5px] bg-primary/8">
                <span className="h-[6px] w-[6px] rounded-[1.5px] border border-primary/40" />
              </span>
              <span className="text-[8.5px] leading-[10px] text-primary">{name}</span>
            </div>
          ))}
        </div>
      </Item>

      {/* Pointer resting on the highlighted space */}
      <Item open={open} i={3} from={{ x: 10, y: 10 }} className="left-[172px] top-[134px]">
        <svg viewBox="0 0 16 20" className="h-[16px] w-[13px]" aria-hidden>
          <path
            d="M1.5 1.5v14.2l3.6-3.4 2.4 5.6 2.6-1.1-2.4-5.5h5.1Z"
            fill="white"
            stroke="#111"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      </Item>

      {/* Useful resources */}
      <Item open={open} i={2} from={{ x: 16 }} className="left-[208px] top-[30px]" box={`w-[102px] p-2.5 ${WIDGET}`}>
        <p className="text-[9px] font-semibold leading-[11px] text-primary">Полезные ресурсы</p>
        <div className="mt-1.5 flex flex-col gap-1.5">
          {RESOURCES_LINKS.map((r) => (
            <span key={r.name} className="flex items-center gap-1.5">
              <span
                className="grid h-[14px] w-[14px] place-items-center rounded-[4px] text-[8px] font-bold leading-none"
                style={{ background: r.bg, color: r.bg === RAIF_YELLOW ? RAIF_INK : 'white' }}
              >
                {r.mark}
              </span>
              <span className="text-[8.5px] leading-[10px]" style={{ color: RAIF_LINK }}>
                {r.name} ↗
              </span>
            </span>
          ))}
        </div>
      </Item>
    </Stage>
  )
}

const visuals: Record<NonNullable<CaseCard['visual']>, (p: VisualProps) => ReactNode> = {
  oversecured: Oversecured,
  preplab: Preplab,
  cloud: Cloud,
  '2pr': Pr,
  raif: Raif,
}
