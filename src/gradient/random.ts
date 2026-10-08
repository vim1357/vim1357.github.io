import { oklch } from './color'
import { swatch, type Blob, type Form, type State } from './state'

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const int = (a: number, b: number) => Math.floor(rnd(a, b + 1))
const chance = (p: number) => Math.random() < p
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]
const wrap = (deg: number) => ((deg % 360) + 360) % 360

function weighted<T>(table: readonly (readonly [T, number])[]): T {
  let r = Math.random() * table.reduce((sum, [, w]) => sum + w, 0)
  for (const [value, w] of table) {
    r -= w
    if (r <= 0) return value
  }
  return table[table.length - 1][0]
}

/* ─────────────────────────────────────────────────────────────
 * Palettes
 *
 * Random RGB is what makes generated gradients ugly. Every scheme here is
 * built in OKLCH around the same rules instead: lightness moves in one
 * direction along the palette, chroma peaks in the middle and drains toward
 * the highlight, and hue travels a bounded arc rather than jumping.
 * ───────────────────────────────────────────────────────────── */

/** OKLCH hue bands, weighted toward the ones that hold up at any lightness. */
const HUES: readonly (readonly [readonly [number, number], number])[] = [
  [[0, 35], 1.6], // pink → red
  [[35, 80], 2.2], // orange
  [[80, 115], 0.6], // yellow
  [[115, 165], 0.5], // green
  [[165, 215], 1.5], // teal → cyan
  [[215, 275], 3.2], // blue → indigo
  [[275, 320], 2.2], // violet
  [[320, 360], 2], // magenta
]

const pickHue = () => rnd(...weighted(HUES))

/** Yellow-green goes olive when it is dark and saturated. */
const muddy = (h: number) => wrap(h) > 75 && wrap(h) < 165

/** Signed hue travel for a ramp starting at h0, steered away from the olive band. */
function drift(h0: number): number {
  const span = rnd(45, 115)
  const dir = chance(0.5) ? 1 : -1
  const clean = (d: number) => !muddy(h0 + d) && !muddy(h0 + d / 2)
  if (clean(dir * span)) return dir * span
  if (clean(-dir * span)) return -dir * span
  return dir * 30
}

type Tone = 'dark' | 'light'
interface Palette {
  colors: string[]
  tone: Tone
}

/** Near-black base, then a glow whose hue drifts as it gets lighter. */
function darkDrift(): Palette {
  const h0 = pickHue()
  const d = drift(h0)
  const n = int(3, 4)
  const peak = rnd(0.17, 0.25)
  const colors = [oklch(rnd(0.1, 0.16), rnd(0.01, 0.035), h0)]
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    colors.push(oklch(0.36 + 0.58 * t ** 0.9, peak * (1 - 0.78 * t ** 2.2), h0 + d * t))
  }
  return { colors, tone: 'dark' }
}

/** One hue from near-black to near-white; a third of the time almost grey. */
function mono(): Palette {
  const h = pickHue()
  const peak = chance(0.3) ? rnd(0.025, 0.06) : rnd(0.12, 0.2)
  const twist = rnd(-14, 14)
  const steps = chance(0.5) ? [0.12, 0.3, 0.52, 0.76, 0.95] : [0.13, 0.36, 0.64, 0.94]
  const colors = steps.map((l, i) =>
    oklch(l, peak * Math.max(0.2, 1 - ((l - 0.55) / 0.5) ** 2), h + (twist * i) / steps.length),
  )
  return { colors, tone: 'dark' }
}

/** Dark cool base, a warm band, a cream highlight, then back into the cool. */
function warmCool(): Palette {
  const cool = rnd(225, 280)
  const warm = rnd(25, 70)
  const colors = [
    oklch(rnd(0.1, 0.15), 0.03, cool),
    oklch(rnd(0.64, 0.72), rnd(0.17, 0.21), warm),
    oklch(0.93, 0.04, warm + 25),
    oklch(rnd(0.6, 0.7), rnd(0.11, 0.15), cool - 15),
    oklch(rnd(0.36, 0.45), rnd(0.16, 0.2), cool),
  ]
  if (chance(0.3)) colors.pop()
  return { colors, tone: 'dark' }
}

/** Like darkDrift, but the base is a deep saturated colour instead of black. */
function vivid(): Palette {
  // A deep orange or yellow is just brown, so the base stays out of that arc.
  let h0 = pickHue()
  while (wrap(h0) > 20 && wrap(h0) < 165) h0 = pickHue()
  const d = drift(h0)
  const colors = [
    oklch(rnd(0.22, 0.3), rnd(0.09, 0.14), h0),
    oklch(0.5, 0.22, h0 + d * 0.33),
    oklch(0.7, 0.19, h0 + d * 0.66),
    oklch(0.9, 0.08, h0 + d),
  ]
  return { colors, tone: 'dark' }
}

/** Off-white base, two accents (neighbours or complements) and one dark anchor. */
function light(): Palette {
  const h1 = pickHue()
  let h2 = h1 + (chance(0.5) ? rnd(150, 210) : pick([-1, 1]) * rnd(25, 50))
  if (muddy(h2)) h2 = h1 + 35
  const colors = [
    oklch(rnd(0.95, 0.975), rnd(0.004, 0.015), h1),
    oklch(rnd(0.62, 0.74), rnd(0.11, 0.17), h2),
    oklch(rnd(0.68, 0.76), rnd(0.15, 0.2), h1),
    oklch(rnd(0.17, 0.27), rnd(0.02, 0.06), pick([h1, h2])),
  ]
  return { colors, tone: 'light' }
}

/** Light, low-chroma neighbours. */
function pastel(): Palette {
  const h0 = pickHue()
  const step = pick([-1, 1]) * rnd(28, 55)
  const colors = [
    oklch(0.97, 0.012, h0),
    oklch(rnd(0.84, 0.9), rnd(0.07, 0.11), h0),
    oklch(rnd(0.86, 0.92), rnd(0.06, 0.1), h0 + step),
    oklch(rnd(0.8, 0.88), rnd(0.07, 0.11), h0 + step * 2),
  ]
  return { colors, tone: 'light' }
}

const SCHEMES: readonly (readonly [() => Palette, number])[] = [
  [darkDrift, 30],
  [mono, 18],
  [vivid, 16],
  [warmCool, 14],
  [light, 14],
  [pastel, 8],
]

const randomPalette = () => weighted(SCHEMES)()

/* ─────────────────────────────────────────────────────────────
 * Composition
 * ───────────────────────────────────────────────────────────── */

/**
 * Best-candidate placement: of a handful of random spots, take the one
 * farthest from the blobs already placed, with a pull toward the edges so the
 * frame keeps a calm area instead of an even polka-dot spread.
 */
export function placeBlob(existing: readonly Blob[]): Blob {
  let best = { x: 0.5, y: 0.5 }
  let bestScore = -Infinity
  for (let i = 0; i < 14; i++) {
    const c = { x: rnd(-0.08, 1.08), y: rnd(-0.08, 1.08) }
    const nearest = Math.min(2, ...existing.map((b) => Math.hypot(b.x - c.x, b.y - c.y)))
    const score = nearest + 0.35 * Math.hypot(c.x - 0.5, c.y - 0.5)
    if (score > bestScore) {
      best = c
      bestScore = score
    }
  }
  return { ...best, r: rnd(0.35, 0.75), a: rnd(0, Math.PI) }
}

function layoutBlobs(n: number): Blob[] {
  const blobs: Blob[] = []
  while (blobs.length < n) blobs.push(placeBlob(blobs))
  return blobs
}

/** Fresh, good-looking parameters for `form`; colours and frame untouched. */
function compose(form: Form, colorCount: number, frame: { w: number; h: number }): Partial<State> {
  const base = { form, seed: int(1, 65_535), cx: 0.5, cy: 0.5 }
  const anyAngle = rnd(0, 360)

  switch (form) {
    case 'blobs':
      return {
        ...base,
        // Few and large: that is what leaves a calm area in the frame.
        blobs: layoutBlobs(Math.min(4, Math.max(2, colorCount - 1))),
        scale: rnd(0.85, 1.25),
        soft: chance(0.25) ? rnd(0.3, 0.5) : rnd(0.55, 0.9),
        stretch: chance(0.7) ? 1 : rnd(1.4, 2.6),
        angle: anyAngle,
        warp: chance(0.35) ? 0 : rnd(0.1, 0.5),
        detail: rnd(0.5, 1.4),
      }
    case 'beam': {
      // Mostly diagonals: a beam parallel to the frame edge reads as a plain CSS gradient.
      const angle = chance(0.8) ? pick([0, 90, 180, 270]) + rnd(20, 70) : anyAngle
      const back = rnd(0.05, 0.28)
      const rad = (angle * Math.PI) / 180
      // Bending inward is kept gentle: a tight one collapses into a small spot mid-frame.
      const curve = weighted([
        [0, 45],
        [rnd(0.15, 0.75), 40],
        [rnd(-0.45, -0.25), 15],
      ])
      return {
        ...base,
        angle,
        cx: 0.5 - Math.cos(rad) * back,
        cy: 0.5 - Math.sin(rad) * back,
        scale: curve < 0 ? rnd(0.6, 1.1) : rnd(0.55, 1.5),
        soft: rnd(0.1, 1),
        curve,
        warp: chance(0.4) ? 0 : rnd(0.1, 0.45),
        detail: rnd(0.4, 1.2),
      }
    }
    case 'wave':
      return {
        ...base,
        cy: rnd(0.4, 0.6),
        angle: chance(0.75) ? wrap(rnd(-25, 25) + pick([0, 180])) : anyAngle,
        scale: rnd(0.6, 1.4),
        soft: rnd(0.6, 1),
        amp: rnd(0.1, 0.4),
        freq: rnd(0.35, 1.3),
        warp: chance(0.5) ? 0 : rnd(0.05, 0.3),
        detail: rnd(0.5, 1.2),
      }
    case 'folds':
      return {
        ...base,
        cx: rnd(0.2, 0.8),
        cy: rnd(0.2, 0.8),
        angle: anyAngle,
        scale: rnd(0.9, 2),
        soft: rnd(0, 0.45),
        warp: rnd(0.15, 0.6),
        detail: rnd(0.4, 1),
      }
    case 'conic': {
      // Apex near an edge or corner (a centred cone is a pie chart), with the
      // crease aimed back across the frame so it is always in the picture.
      const edge = () => pick([rnd(0, 0.22), rnd(0.78, 1)])
      const [cx, cy] = pick([
        [edge(), edge()],
        [edge(), rnd(0.3, 0.7)],
        [rnd(0.3, 0.7), edge()],
      ])
      const toCentre = (Math.atan2((0.5 - cy) * frame.h, (0.5 - cx) * frame.w) * 180) / Math.PI
      return {
        ...base,
        cx,
        cy,
        angle: wrap(toCentre + rnd(-40, 40)),
        rays: weighted([
          [1, 6],
          [2, 3],
          [3, 1],
        ]),
        soft: rnd(0, 0.5),
        warp: chance(0.3) ? 0 : rnd(0.1, 0.5),
        detail: rnd(0.4, 1.2),
      }
    }
  }
}

/** Light palettes read best as soft blobs; dark ones carry any form. */
const FORM_WEIGHTS: Record<Tone, readonly (readonly [Form, number])[]> = {
  dark: [
    ['blobs', 28],
    ['beam', 28],
    ['folds', 16],
    ['conic', 14],
    ['wave', 14],
  ],
  light: [
    ['blobs', 75],
    ['beam', 25],
  ],
}

/** New palette, form and composition. Frame size and grain stay as the user set them. */
export function randomAll(s: State): State {
  const palette = randomPalette()
  const form = weighted(FORM_WEIGHTS[palette.tone])
  return { ...s, colors: palette.colors.map(swatch), ...compose(form, palette.colors.length, s) }
}

export function randomColors(s: State): State {
  return { ...s, colors: randomPalette().colors.map(swatch) }
}

/** Same form and colours, new arrangement. */
export function randomLayout(s: State): State {
  return { ...s, ...compose(s.form, s.colors.length, s) }
}
