import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { Reorder, motion, useDragControls } from 'motion/react'
import { Tooltip } from '../components/Tooltip'
import { normalizeHex } from './color'
import type { Swatch } from './state'

const FOCUS = 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent'

/** Small muted heading over a group of controls, with optional actions on the right. */
export function Panel({
  title,
  actions,
  children,
}: {
  title: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-sm leading-5 text-muted">{title}</h2>
        {actions && <div className="flex items-center gap-1">{actions}</div>}
      </div>
      {children}
    </section>
  )
}

/** Same grouped-rows card as the portfolio lists: flat rows, 2px gap, 16px corners. */
export function Rows({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-0.5 overflow-hidden rounded-card">{children}</div>
}

/**
 * Slider where the row itself is the track: drag anywhere on it. Touch only
 * starts adjusting after a clear horizontal move, so a row full of sliders can
 * still be scrolled with a thumb.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  const drag = useRef<{ x: number; active: boolean } | null>(null)
  const snap = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step))

  const setFromPointer = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onChange(snap(min + ((e.clientX - r.left) / r.width) * (max - min)))
  }

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const touch = e.pointerType === 'touch'
    drag.current = { x: e.clientX, active: !touch }
    e.currentTarget.setPointerCapture(e.pointerId)
    if (!touch) setFromPointer(e)
  }
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d) return
    if (!d.active && Math.abs(e.clientX - d.x) > 6) d.active = true
    if (d.active) setFromPointer(e)
  }
  const end = () => {
    drag.current = null
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const jump = (e.shiftKey ? 10 : 1) * step
    const next: Record<string, number> = {
      ArrowLeft: value - jump,
      ArrowDown: value - jump,
      ArrowRight: value + jump,
      ArrowUp: value + jump,
      Home: min,
      End: max,
    }
    if (!(e.key in next)) return
    e.preventDefault()
    onChange(snap(next[e.key]))
  }

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={end}
      onPointerCancel={end}
      onKeyDown={onKeyDown}
      className={`group relative flex h-11 cursor-ew-resize touch-pan-y select-none items-center justify-between gap-3 bg-surface px-4 text-sm leading-5 ${FOCUS}`}
    >
      <span
        className="absolute inset-y-0 left-0 border-r-2 border-faint bg-surface-2 transition-colors group-hover:border-muted"
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        aria-hidden
      />
      <span className="relative truncate text-primary">{label}</span>
      <span className="relative shrink-0 tabular-nums text-muted">{format(value)}</span>
    </div>
  )
}

/** One-of-many switch, laid out like a single split button. */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { value: T; label: string }[]
  value: T | null
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5 overflow-hidden rounded-btn">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-10 min-w-0 flex-1 truncate px-1 text-sm leading-5 transition-colors ${FOCUS} ${
            o.value === value
              ? 'bg-primary text-background'
              : 'bg-surface text-muted hover:bg-surface-2 hover:text-primary'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Square icon button with a tooltip that doubles as its accessible name. */
export function IconButton({
  label,
  onClick,
  disabled,
  size = 'md',
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'md'
  children: ReactNode
}) {
  return (
    <Tooltip content={label} side="bottom">
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.92 }}
        className={`grid shrink-0 place-items-center text-primary transition-colors disabled:text-faint ${FOCUS} ${
          size === 'md'
            ? 'h-10 w-10 rounded-btn bg-surface enabled:hover:bg-surface-2'
            : 'h-8 w-8 rounded-[8px] text-muted enabled:hover:bg-surface enabled:hover:text-primary'
        }`}
      >
        {children}
      </motion.button>
    </Tooltip>
  )
}

/** Number field that commits on blur / Enter and snaps back if the text is not a number. */
export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])

  const commit = () => {
    const n = Math.round(Number(draft))
    if (draft.trim() && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)))
    else setDraft(String(value))
  }

  return (
    <label className="flex h-11 min-w-0 flex-1 items-center justify-between gap-3 bg-surface px-4 text-sm leading-5">
      <span className="text-primary">{label}</span>
      <input
        value={draft}
        inputMode="numeric"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="w-16 bg-transparent text-right tabular-nums text-muted outline-none focus:text-primary"
      />
    </label>
  )
}

/** A row that picks one colour of the palette by its swatch. */
export function SwatchPick({
  label,
  colors,
  value,
  onChange,
}: {
  label: string
  colors: Swatch[]
  value: number
  onChange: (index: number) => void
}) {
  return (
    <div className="flex h-11 items-center justify-between gap-3 bg-surface px-4 text-sm leading-5">
      <span className="truncate text-primary">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex shrink-0 gap-1.5">
        {colors.map((c, i) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={i === value}
            aria-label={i === 0 ? `Фон, ${c.hex}` : c.hex}
            onClick={() => onChange(i)}
            style={{ backgroundColor: c.hex }}
            className={`h-6 w-6 rounded-full border border-faint transition-shadow ${FOCUS} ${
              i === value ? 'shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--text)]' : ''
            }`}
          />
        ))}
      </div>
    </div>
  )
}

/** Drag-to-reorder list of colours: picker swatch, hex field, remove. */
export function ColorList({
  colors,
  min,
  onChange,
}: {
  colors: Swatch[]
  min: number
  onChange: (next: Swatch[]) => void
}) {
  // Rows slide into place only while one is being dragged. Otherwise the list
  // would also glide every time a control appears above it and pushes it down.
  const [dragging, setDragging] = useState(false)

  return (
    <Reorder.Group
      axis="y"
      values={colors}
      onReorder={onChange}
      className="flex flex-col gap-0.5 overflow-hidden rounded-card"
    >
      {colors.map((c, i) => (
        <ColorRow
          key={c.id}
          swatch={c}
          slide={dragging}
          onDrag={setDragging}
          note={i === 0 ? 'фон' : undefined}
          onHex={(hex) => onChange(colors.map((x) => (x.id === c.id ? { ...x, hex } : x)))}
          onRemove={colors.length > min ? () => onChange(colors.filter((x) => x.id !== c.id)) : undefined}
        />
      ))}
    </Reorder.Group>
  )
}

function ColorRow({
  swatch,
  slide,
  note,
  onDrag,
  onHex,
  onRemove,
}: {
  swatch: Swatch
  slide: boolean
  note?: string
  onDrag: (active: boolean) => void
  onHex: (hex: string) => void
  onRemove?: () => void
}) {
  const controls = useDragControls()
  // Text being typed; null while the field just mirrors the swatch.
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Reorder.Item
      value={swatch}
      dragListener={false}
      dragControls={controls}
      transition={slide ? undefined : { layout: { duration: 0 } }}
      onDragStart={() => onDrag(true)}
      onDragEnd={() => onDrag(false)}
      className="relative flex h-11 select-none items-center gap-2 bg-surface pl-1.5 pr-1.5"
    >
      <button
        type="button"
        aria-label="Перетащить"
        onPointerDown={(e) => controls.start(e)}
        className="grid h-8 w-6 shrink-0 cursor-grab touch-none place-items-center text-faint transition-colors hover:text-muted active:cursor-grabbing"
      >
        <Grip />
      </button>
      <label
        className="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-badge ring-1 ring-inset ring-line"
        style={{ background: swatch.hex }}
      >
        <input
          type="color"
          value={swatch.hex}
          onChange={(e) => onHex(e.target.value)}
          aria-label="Выбрать цвет"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
      <input
        value={draft ?? swatch.hex.toUpperCase()}
        spellCheck={false}
        maxLength={7}
        aria-label="HEX"
        onChange={(e) => {
          setDraft(e.target.value)
          const hex = normalizeHex(e.target.value)
          if (hex && e.target.value.replace('#', '').length === 6) onHex(hex)
        }}
        onBlur={() => {
          const hex = draft && normalizeHex(draft)
          if (hex) onHex(hex)
          setDraft(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="min-w-0 flex-1 bg-transparent pl-1 text-sm leading-5 tabular-nums text-primary outline-none"
      />
      {note && <span className="shrink-0 text-xs leading-4 text-faint">{note}</span>}
      <button
        type="button"
        aria-label="Убрать цвет"
        onClick={onRemove}
        disabled={!onRemove}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-[8px] text-muted transition-colors enabled:hover:bg-surface-2 enabled:hover:text-primary disabled:text-faint ${FOCUS}`}
      >
        <Close />
      </button>
    </Reorder.Item>
  )
}

/* Glyphs — inlined so they theme via currentColor, same weight as the theme toggle. */

function Icon({ children, className = 'h-5 w-5' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const Dice = () => (
  <Icon>
    <rect x="4" y="4" width="16" height="16" rx="4" />
    <path d="M9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01" strokeWidth="2.2" />
  </Icon>
)
export const Shake = () => (
  <Icon>
    <circle cx="12" cy="12" r="4.5" />
    <path d="M4.5 8c-1.2 2.5-1.2 5.5 0 8M19.5 8c1.2 2.5 1.2 5.5 0 8" />
  </Icon>
)
export const Undo = () => (
  <Icon>
    <path d="M9 7 4.5 11.5 9 16" />
    <path d="M5 11.5h9a5 5 0 0 1 0 10h-2" />
  </Icon>
)
export const Redo = () => (
  <Icon>
    <path d="m15 7 4.5 4.5L15 16" />
    <path d="M19 11.5h-9a5 5 0 0 0 0 10h2" />
  </Icon>
)
export const Flip = () => (
  <Icon>
    <path d="M8 4v16M8 20l-3.5-3.5M8 4 4.5 7.5M16 20V4M16 4l3.5 3.5M16 20l3.5-3.5" />
  </Icon>
)
export const Plus = () => (
  <Icon>
    <path d="M12 5.5v13M5.5 12h13" />
  </Icon>
)
export const Download = () => (
  <Icon>
    <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" />
  </Icon>
)
export const Link = () => (
  <Icon>
    <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
    <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
  </Icon>
)
export const ArrowLeft = () => (
  <Icon>
    <path d="M19 12H5M10.5 6.5 5 12l5.5 5.5" />
  </Icon>
)
const Close = () => (
  <Icon className="h-4 w-4">
    <path d="m6.5 6.5 11 11M17.5 6.5l-11 11" />
  </Icon>
)
const Grip = () => (
  <Icon className="h-4 w-4">
    <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth="2.4" />
  </Icon>
)
