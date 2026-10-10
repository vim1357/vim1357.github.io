import { MAX_BLOBS, MAX_COLORS } from './shader'

export const FORMS = ['blobs', 'ribbon', 'folds', 'mesh'] as const
export type Form = (typeof FORMS)[number]

/**
 * One shape. It has a head and a tail: the fill runs from one palette colour
 * to another along that axis, and the head can be crisper than the tail.
 * Position is in frame fractions (0..1 of width / height), radius in short sides.
 */
export interface Blob {
  x: number
  y: number
  r: number
  /** Where the head points, in radians. */
  a: number
  /** Length along the head–tail axis relative to the width: below 1 is a wide dome. */
  st: number
  soft: number
  /** How much of the softness the head gives up: 0 is even all round, 1 is a clean cut. */
  edge: number
  /** Palette index at the head and at the tail. 0 is the background — a shape that covers. */
  c1: number
  c2: number
}

/** Per-shape sliders: range and step, shared by the panel and the link. */
export const BLOB_RANGE = {
  x: [-1, 2],
  y: [-1, 2],
  r: [0.05, 2],
  a: [0, 2 * Math.PI],
  st: [0.4, 3.6],
  soft: [0, 1],
  edge: [0, 1],
} as const

/** `id` only keeps list reordering stable; it is not part of a shared link. */
export interface Swatch {
  id: number
  hex: string
}

export interface State {
  w: number
  h: number
  form: Form
  /** First colour is the background; the rest are the ramp / what the shapes pick from. */
  colors: Swatch[]
  blobs: Blob[]
  seed: number
  cx: number
  cy: number
  scale: number
  soft: number
  angle: number
  /** Ribbon: how much wider it gets from one end to the other. */
  taper: number
  amp: number
  freq: number
  /** Folds across the frame. */
  count: number
  /** Mesh: how far its folds pull the colour apart and how much light and shadow they carry. */
  depth: number
  /** Mesh: how far everything is pulled out along the angle. */
  stretch: number
  /** How unevenly the frame is in focus: 0 keeps every edge as soft as set. */
  focus: number
  warp: number
  detail: number
  grain: number
  grainSize: number
}

export type NumKey = {
  [K in keyof State]: State[K] extends number ? K : never
}[keyof State]

/** Allowed range per numeric field — shared by the sliders and link parsing. */
export const RANGE: Record<NumKey, readonly [number, number]> = {
  w: [64, 4096],
  h: [64, 4096],
  seed: [0, 65535],
  cx: [-1, 2],
  cy: [-1, 2],
  scale: [0.2, 2.5],
  soft: [0, 1],
  angle: [0, 360],
  taper: [0, 1],
  amp: [0, 1],
  freq: [0.2, 3],
  count: [1, 2],
  depth: [0, 1],
  stretch: [1, 4],
  focus: [0, 1],
  warp: [0, 1],
  detail: [0.3, 3],
  grain: [0, 1],
  // 0 is the finest grain there is (one pixel); see the renderer for the mapping.
  grainSize: [0, 2],
}

/** Slider increment per field. Positions (cx, cy) are dragged, so they have none. */
export const STEP: Partial<Record<NumKey, number>> = {
  w: 1,
  h: 1,
  seed: 1,
  scale: 0.01,
  soft: 0.01,
  angle: 1,
  taper: 0.01,
  amp: 0.01,
  freq: 0.05,
  count: 1,
  depth: 0.01,
  stretch: 0.05,
  focus: 0.01,
  warp: 0.01,
  detail: 0.05,
  grain: 0.01,
  grainSize: 0.1,
}

let nextId = 1
export const swatch = (hex: string): Swatch => ({ id: nextId++, hex })

export const DEFAULT_STATE: State = {
  w: 1920,
  h: 1080,
  form: 'mesh',
  colors: ['#0b0b10', '#2b1a66', '#a32fd1', '#f2488f', '#f4ecff'].map(swatch),
  blobs: [
    { x: 0.2, y: 0.85, r: 0.55, a: 5.2, st: 1.4, soft: 0.8, edge: 0.6, c1: 3, c2: 1 },
    { x: 0.85, y: 0.25, r: 0.45, a: 2.4, st: 1, soft: 0.85, edge: 0, c1: 2, c2: 1 },
    { x: 0.62, y: 0.72, r: 0.26, a: 4, st: 1, soft: 0.7, edge: 0.9, c1: 0, c2: 0 },
  ],
  seed: 7,
  cx: 0.42,
  cy: 0.36,
  scale: 1.2,
  soft: 0.35,
  angle: 58,
  taper: 0.6,
  amp: 0.5,
  freq: 0.8,
  count: 2,
  depth: 0.7,
  stretch: 2,
  focus: 0.6,
  warp: 0.25,
  detail: 0.8,
  grain: 0.4,
  grainSize: 0.2,
}

/* ─────────────────────────────────────────────────────────────
 * Link format
 *
 * There is no server to keep gradients behind a short id, so the link has to
 * carry the gradient itself. To keep it short it is packed as bytes instead
 * of JSON: sliders as their step index, and only the fields the current form
 * actually uses. A typical link is 50–60 characters.
 * ───────────────────────────────────────────────────────────── */

const VERSION = 6

const COMMON: readonly NumKey[] = ['w', 'h', 'seed', 'focus', 'warp', 'detail', 'grain', 'grainSize']

const FORM_FIELDS: Record<Form, readonly NumKey[]> = {
  blobs: ['scale'],
  ribbon: ['scale', 'soft', 'amp', 'freq', 'taper', 'angle', 'cx', 'cy'],
  folds: ['count', 'soft', 'amp', 'freq', 'angle', 'cx', 'cy'],
  mesh: ['scale', 'soft', 'amp', 'freq', 'depth', 'stretch', 'angle', 'cx', 'cy'],
}

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))

/** How many positions a field has in a link: its slider steps, or 16 bits if it is continuous. */
function levels(key: NumKey): number {
  const step = STEP[key]
  return step ? Math.round((RANGE[key][1] - RANGE[key][0]) / step) : 65535
}

/** State → compact string for the URL hash. */
export function encode(s: State): string {
  const bytes: number[] = []
  // One byte if the value fits, otherwise two.
  const put = (v: number, range: readonly [number, number], n: number) => {
    const q = Math.round(((clamp(v, range) - range[0]) / (range[1] - range[0])) * n)
    if (n > 255) bytes.push(q >> 8)
    bytes.push(q & 255)
  }

  const blobs = s.form === 'blobs' ? s.blobs.slice(0, MAX_BLOBS) : []
  const colors = s.colors.slice(0, MAX_COLORS)
  bytes.push((VERSION << 4) | FORMS.indexOf(s.form), (colors.length << 4) | blobs.length)
  for (const c of colors) {
    const n = parseInt(c.hex.slice(1), 16)
    bytes.push(n >> 16, (n >> 8) & 255, n & 255)
  }
  for (const key of [...COMMON, ...FORM_FIELDS[s.form]]) put(s[key], RANGE[key], levels(key))
  for (const b of blobs) {
    put(b.x, BLOB_RANGE.x, 65535)
    put(b.y, BLOB_RANGE.y, 65535)
    put(b.r, BLOB_RANGE.r, 255)
    put(b.a, BLOB_RANGE.a, 255)
    put(b.st, BLOB_RANGE.st, 255)
    put(b.soft, BLOB_RANGE.soft, 255)
    put(b.edge, BLOB_RANGE.edge, 255)
    bytes.push((b.c1 << 4) | b.c2)
  }
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * URL hash → State. A link is outside input, so nothing in it is trusted:
 * values can only land inside their ranges, and anything malformed or cut
 * short gives null (the page then opens on the default gradient).
 */
export function decode(hash: string): State | null {
  let bytes: number[]
  try {
    bytes = [...atob(hash.replace(/-/g, '+').replace(/_/g, '/'))].map((c) => c.charCodeAt(0))
  } catch {
    return null
  }

  let at = 0
  let short = false
  const byte = () => {
    if (at >= bytes.length) short = true
    return bytes[at++] ?? 0
  }
  const get = (range: readonly [number, number], n: number) => {
    const q = n > 255 ? (byte() << 8) | byte() : byte()
    const v = range[0] + (Math.min(q, n) / n) * (range[1] - range[0])
    // Trims float noise (0.30000000000000004) without losing a 16-bit position.
    return Number(v.toFixed(5))
  }

  const head = byte()
  const counts = byte()
  const form = FORMS[head & 15]
  const colorCount = counts >> 4
  const blobCount = counts & 15
  if (head >> 4 !== VERSION || !form) return null
  if (colorCount < 2 || colorCount > MAX_COLORS || blobCount > MAX_BLOBS) return null

  const s: State = { ...DEFAULT_STATE, form }
  s.colors = Array.from({ length: colorCount }, () =>
    swatch(`#${[byte(), byte(), byte()].map((b) => b.toString(16).padStart(2, '0')).join('')}`),
  )
  for (const key of [...COMMON, ...FORM_FIELDS[form]]) s[key] = get(RANGE[key], levels(key))
  if (blobCount) {
    s.blobs = Array.from({ length: blobCount }, () => {
      const b = {
        x: get(BLOB_RANGE.x, 65535),
        y: get(BLOB_RANGE.y, 65535),
        r: get(BLOB_RANGE.r, 255),
        a: get(BLOB_RANGE.a, 255),
        st: get(BLOB_RANGE.st, 255),
        soft: get(BLOB_RANGE.soft, 255),
        edge: get(BLOB_RANGE.edge, 255),
      }
      const pair = byte()
      return { ...b, c1: Math.min(pair >> 4, colorCount - 1), c2: Math.min(pair & 15, colorCount - 1) }
    })
  }
  return short ? null : s
}
