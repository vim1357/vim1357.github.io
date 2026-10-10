import { oklch } from './color'
import { MAX_BLOBS } from './shader'
import { BLOB_RANGE, swatch, type Blob, type Form, type State } from './state'

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const int = (a: number, b: number) => Math.floor(rnd(a, b + 1))
const chance = (p: number) => Math.random() < p
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)]
const wrap = (deg: number) => ((deg % 360) + 360) % 360
const TAU = Math.PI * 2

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

type Fits = readonly (readonly [Form, number])[]

/** A palette that climbs steadily away from its background carries any form. */
const ANY: Fits = [
  ['mesh', 42],
  ['blobs', 26],
  ['ribbon', 20],
  ['folds', 12],
]
/** Light grounds are mostly a matter of soft shapes. */
const SOFT: Fits = [
  ['mesh', 46],
  ['blobs', 38],
  ['ribbon', 14],
  ['folds', 2],
]
/** A set of colours rather than a ramp: fine for shapes to pick from, wrong as a band. */
const SET: Fits = [
  ['mesh', 55],
  ['blobs', 45],
]

/*
 * Every scheme is ordered the same way: the background first, then colours
 * further and further from it. The forms rely on that — the last colour is
 * the crest of a ribbon and the lip of a fold, and shapes blend neighbours.
 */

/** Near-black base, then a glow whose hue drifts as it gets lighter. */
function darkDrift(): string[] {
  const h0 = pickHue()
  const d = drift(h0)
  const n = int(3, 4)
  const peak = rnd(0.17, 0.25)
  // Now and then the dark itself is a colour: deep green, deep plum.
  const tinted = chance(0.3)
  const colors = [oklch(tinted ? rnd(0.15, 0.2) : rnd(0.1, 0.16), tinted ? rnd(0.04, 0.06) : rnd(0.01, 0.035), h0)]
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1)
    colors.push(oklch(0.36 + 0.58 * t ** 0.9, peak * (1 - 0.78 * t ** 2.2), h0 + d * t))
  }
  return colors
}

/** One hue from near-black to near-white; a third of the time almost grey. */
function mono(): string[] {
  const h = pickHue()
  const peak = chance(0.35) ? rnd(0.025, 0.06) : rnd(0.12, 0.2)
  const twist = rnd(-14, 14)
  const steps = [rnd(0.08, 0.13), rnd(0.3, 0.38), rnd(0.58, 0.66), 0.94]
  return steps.map((l, i) =>
    oklch(l, peak * Math.max(0.2, 1 - ((l - 0.55) / 0.5) ** 2), h + (twist * i) / steps.length),
  )
}

/** One cool hue out of the dark, and a single warm light on top of it. */
function ember(): string[] {
  const cool = rnd(215, 270)
  const warm = rnd(40, 90)
  const colors = [
    oklch(rnd(0.1, 0.17), rnd(0.02, 0.04), cool),
    oklch(rnd(0.34, 0.42), rnd(0.07, 0.11), cool),
    oklch(rnd(0.6, 0.7), rnd(0.08, 0.12), cool - rnd(0, 20)),
    oklch(rnd(0.8, 0.88), rnd(0.1, 0.15), warm),
  ]
  if (chance(0.4)) colors.push(oklch(0.96, 0.03, warm))
  return colors
}

/** Red through orange into yellow, the way a flame climbs; sometimes it starts from magenta. */
function fire(): string[] {
  const start = chance(0.35) ? rnd(340, 360) : rnd(15, 30)
  const span = (rnd(80, 95) - start + 360) % 360
  return [
    oklch(rnd(0.08, 0.13), 0.015, start),
    oklch(rnd(0.46, 0.54), 0.2, start),
    oklch(0.7, 0.19, start + span * 0.55),
    oklch(0.87, 0.16, start + span),
  ]
}

/** Dark cool base, a warm band, a cream highlight, then back into the cool. */
function aura(): string[] {
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
  return colors
}

/** Like darkDrift, but the base is a deep saturated colour instead of black. */
function vivid(): string[] {
  // A deep orange or yellow is just brown, so the base stays out of that arc.
  let h0 = pickHue()
  while (wrap(h0) > 20 && wrap(h0) < 165) h0 = pickHue()
  const d = drift(h0)
  return [
    oklch(rnd(0.22, 0.3), rnd(0.09, 0.14), h0),
    oklch(0.5, 0.22, h0 + d * 0.33),
    oklch(0.7, 0.19, h0 + d * 0.66),
    oklch(0.9, 0.08, h0 + d),
  ]
}

/** Black, one loud warm colour and an off-white; sometimes a muted beige between them. */
function poster(): string[] {
  const h = rnd(15, 55)
  const colors = [
    oklch(rnd(0.06, 0.12), 0.006, h),
    oklch(rnd(0.6, 0.68), rnd(0.18, 0.22), h),
    oklch(rnd(0.88, 0.93), 0.015, 85),
  ]
  if (chance(0.4)) colors.splice(1, 0, oklch(rnd(0.45, 0.55), 0.03, h + 30))
  return colors
}

/** A pale ground with a warm and a cool colour on it, and now and then a deep anchor. */
function paper(): string[] {
  const warm = rnd(8, 50)
  const cool = rnd(200, 265)
  const ground = weighted([
    [oklch(0.975, 0.004, warm), 3], // white
    [oklch(0.95, 0.03, 85), 3], // cream
    [oklch(0.91, 0.03, cool), 2], // pale blue
    [oklch(0.91, 0.004, 80), 2], // light grey
  ])
  const colors = [
    ground,
    oklch(rnd(0.84, 0.9), rnd(0.06, 0.09), warm + rnd(15, 40)),
    oklch(rnd(0.66, 0.76), rnd(0.14, 0.2), warm),
    oklch(rnd(0.62, 0.8), rnd(0.07, 0.14), cool),
  ]
  if (chance(0.35)) colors.push(oklch(rnd(0.24, 0.32), rnd(0.08, 0.12), cool + 10))
  return colors
}

/** A light ground warming up: cream, then orange, then coral. */
function blush(): string[] {
  const coral = rnd(5, 30)
  return [
    chance(0.5) ? oklch(0.92, 0.003, 80) : oklch(0.955, 0.02, 85),
    oklch(0.93, 0.06, coral + 70),
    oklch(rnd(0.8, 0.85), rnd(0.11, 0.14), coral + 45),
    oklch(rnd(0.7, 0.75), rnd(0.15, 0.19), coral),
  ]
}

/** Light, low-chroma neighbours. */
function pastel(): string[] {
  const h0 = pickHue()
  const step = pick([-1, 1]) * rnd(28, 55)
  return [
    oklch(0.97, 0.012, h0),
    oklch(rnd(0.86, 0.92), rnd(0.06, 0.1), h0 + step),
    oklch(rnd(0.84, 0.9), rnd(0.07, 0.11), h0),
    oklch(rnd(0.8, 0.86), rnd(0.07, 0.11), h0 + step * 2),
  ]
}

/** A ground of middle lightness, coloured or grey; everything on it is lighter and warmer. */
function midtone(): string[] {
  const groundHue = weighted([
    [rnd(255, 290), 3], // periwinkle
    [rnd(200, 235), 2], // dusty blue
    [rnd(50, 80), 2], // warm grey
  ])
  const grey = groundHue < 100
  const warm = rnd(20, 45)
  const colors = [
    oklch(rnd(0.55, 0.68), grey ? rnd(0.01, 0.02) : rnd(0.05, 0.09), groundHue),
    oklch(rnd(0.66, 0.72), rnd(0.16, 0.2), warm),
    oklch(rnd(0.82, 0.86), rnd(0.1, 0.14), warm + rnd(30, 50)),
    oklch(rnd(0.93, 0.96), 0.03, warm + 40),
  ]
  if (!grey && chance(0.35)) colors.splice(3, 0, oklch(0.88, 0.07, rnd(160, 190)))
  return colors
}

/** Light grey with darker, barely coloured shapes: shadows rather than lights. */
function slate(): string[] {
  const h = rnd(220, 260)
  return [
    oklch(rnd(0.88, 0.92), 0.006, 85),
    oklch(rnd(0.7, 0.76), rnd(0.02, 0.035), h),
    oklch(rnd(0.5, 0.58), rnd(0.03, 0.05), h),
    oklch(rnd(0.36, 0.42), rnd(0.035, 0.05), h),
  ]
}

const SCHEMES: readonly { make: () => string[]; weight: number; fits: Fits }[] = [
  { make: darkDrift, weight: 20, fits: ANY },
  { make: mono, weight: 13, fits: ANY },
  { make: ember, weight: 13, fits: ANY },
  { make: paper, weight: 9, fits: SET },
  { make: aura, weight: 8, fits: [['mesh', 45], ['blobs', 25], ['ribbon', 30]] },
  { make: vivid, weight: 8, fits: ANY },
  { make: midtone, weight: 8, fits: SOFT },
  { make: poster, weight: 7, fits: ANY },
  { make: fire, weight: 6, fits: ANY },
  { make: blush, weight: 6, fits: SOFT },
  { make: pastel, weight: 4, fits: SOFT },
  { make: slate, weight: 4, fits: SET },
]

const fit = (fits: Fits, form: Form) => fits.find(([f]) => f === form)?.[1] ?? 0

/** A palette for `form`: schemes that suit it better come up more often, ones that do not never. */
const paletteFor = (form: Form) =>
  weighted(SCHEMES.filter((s) => fit(s.fits, form)).map((s) => [s, s.weight * fit(s.fits, form)] as const)).make()

/* ─────────────────────────────────────────────────────────────
 * Composition
 * ───────────────────────────────────────────────────────────── */

type Frame = { w: number; h: number }

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v))
const turn = (rad: number) => ((rad % TAU) + TAU) % TAU

/** Direction from one frame point to another, as the shader measures angles. */
const aim = (from: { x: number; y: number }, to: { x: number; y: number }, f: Frame) =>
  Math.atan2((to.y - from.y) * f.h, (to.x - from.x) * f.w)

/** A shape of the background colour is a cover; the dice leave it one. */
const isCover = (b: Blob) => b.c1 === 0 && b.c2 === 0

/**
 * Head and tail colours for a new shape. It takes a colour the others have
 * not used yet, so a frame shows the whole palette before repeating any of it.
 */
function tint(colorCount: number, others: readonly Blob[]): Pick<Blob, 'c1' | 'c2'> {
  const all = Array.from({ length: colorCount - 1 }, (_, i) => i + 1)
  const free = all.filter((c) => !others.some((b) => b.c1 === c))
  const c1 = pick(free.length ? free : all)
  // The palette is ordered away from the background, so a tail one step back
  // melts toward it: the shape belongs to the ground instead of sitting on it.
  const c2 = weighted([
    [c1 - 1, 60],
    [0, 20],
    [Math.min(c1 + 1, colorCount - 1), 20],
  ])
  return { c1, c2 }
}

/** How a shape is cut: round or stretched, where its head points, how clean that edge is. */
function cut(at: { x: number; y: number }, frame: Frame): Pick<Blob, 'a' | 'st' | 'soft' | 'edge'> {
  // A clean cut only shows if it faces into the frame, so those heads aim near the centre.
  const crisp = chance(0.55)
  return {
    a: turn(crisp ? aim(at, { x: 0.5, y: 0.5 }, frame) + rnd(-0.9, 0.9) : rnd(0, TAU)),
    // Mostly pulled out into a stroke; a round one or a wide dome now and then.
    st: weighted([
      [rnd(1.5, 3.2), 60],
      [1, 25],
      [rnd(0.5, 0.8), 15],
    ]),
    soft: rnd(0.55, 0.95),
    edge: crisp ? rnd(0.6, 1) : rnd(0, 0.3),
  }
}

/**
 * Best-candidate placement: of a handful of random spots, take the one
 * farthest from the shapes already placed, with a pull toward the edges so the
 * frame keeps a calm area instead of an even polka-dot spread.
 */
export function placeBlob(existing: readonly Blob[], colorCount: number, frame: Frame): Blob {
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
  // One large shape carries the frame; the rest are smaller.
  const r = existing.some((b) => b.r < 0.8) ? rnd(0.3, 0.55) : rnd(0.45, 0.7)
  return { ...best, r, ...cut(best, frame), ...tint(colorCount, existing) }
}

/**
 * A background-coloured shape laid over `over`, its clean edge facing into
 * it: the dark disc in front of the light is what gives the frame depth.
 */
function cover(over: Blob, frame: Frame): Blob {
  const short = Math.min(frame.w, frame.h)
  const dir = rnd(0, TAU)
  const dist = over.r * rnd(0.55, 0.95)
  const at = {
    x: over.x + (Math.cos(dir) * dist * short) / frame.w,
    y: over.y + (Math.sin(dir) * dist * short) / frame.h,
  }
  return {
    ...at,
    r: over.r * rnd(0.5, 0.9),
    a: turn(aim(at, over, frame)),
    st: 1,
    soft: rnd(0.5, 0.85),
    edge: rnd(0.7, 1),
    c1: 0,
    c2: 0,
  }
}

/**
 * A very large, very soft shape of the colour nearest the background, off to
 * one side: the ground stops being flat and leans toward what lies on it.
 */
function haze(): Blob {
  const side = () => pick([rnd(-0.1, 0.25), rnd(0.75, 1.1)])
  return { x: side(), y: side(), r: rnd(0.9, 1.3), a: rnd(0, TAU), st: rnd(1, 2), soft: 1, edge: 0, c1: 1, c2: 0 }
}

function layoutBlobs(colorCount: number, frame: Frame): Blob[] {
  const total = int(2, MAX_BLOBS)
  const covered = total >= 3 && chance(0.4)
  const blobs: Blob[] = total >= 3 && chance(0.6) ? [haze()] : []
  while (blobs.length < total - (covered ? 1 : 0)) blobs.push(placeBlob(blobs, colorCount, frame))
  if (covered) blobs.push(cover(pick(blobs.filter((b) => b.r < 0.8)), frame))
  return blobs
}

/** Fresh, good-looking parameters for `form`; colours and frame untouched. */
function compose(form: Form, colorCount: number, frame: Frame): Partial<State> {
  const base = { form, seed: int(1, 65_535), cx: 0.5, cy: 0.5 }
  const anyAngle = rnd(0, 360)

  switch (form) {
    case 'blobs':
      return {
        ...base,
        // Few and large: that is what leaves a calm area in the frame.
        blobs: layoutBlobs(colorCount, frame),
        scale: rnd(0.8, 1.1),
        focus: chance(0.5) ? 0 : rnd(0.2, 0.6),
        warp: chance(0.2) ? 0 : rnd(0.15, 0.5),
        detail: rnd(0.5, 1.4),
      }
    case 'mesh':
      return {
        ...base,
        angle: anyAngle,
        stretch: rnd(1.3, 3),
        // Now and then no folds at all: a plain mesh gradient.
        amp: chance(0.15) ? 0 : rnd(0.25, 0.8),
        depth: rnd(0.5, 1),
        soft: rnd(0.1, 0.5),
        focus: rnd(0.5, 1),
        freq: rnd(0.5, 1.1),
        scale: rnd(0.7, 1.4),
        warp: chance(0.4) ? 0 : rnd(0.05, 0.3),
        detail: rnd(0.4, 1),
      }
    case 'ribbon': {
      const bent = chance(0.85)
      return {
        ...base,
        cx: rnd(0.4, 0.6),
        cy: rnd(0.35, 0.65),
        // A straight one only as a diagonal: parallel to the frame edge it is a plain CSS gradient.
        angle: bent && chance(0.5) ? wrap(rnd(-25, 25) + pick([0, 180])) : pick([0, 90, 180, 270]) + rnd(20, 70),
        scale: rnd(0.8, 1.6),
        taper: rnd(0.3, 1),
        // Mostly light on both sides; now and then one side is cut clean.
        soft: chance(0.25) ? rnd(0.05, 0.3) : rnd(0.5, 1),
        amp: bent ? rnd(0.6, 1) : rnd(0, 0.2),
        freq: rnd(0.3, 0.7),
        focus: chance(0.2) ? 0 : rnd(0.4, 1),
        warp: chance(0.5) ? 0 : rnd(0.05, 0.25),
        detail: rnd(0.5, 1.2),
      }
    }
    case 'folds':
      return {
        ...base,
        cx: rnd(0.3, 0.7),
        cy: rnd(0.3, 0.7),
        angle: chance(0.7) ? pick([0, 90, 180, 270]) + rnd(20, 70) : anyAngle,
        count: int(1, 2),
        soft: rnd(0.2, 0.6),
        amp: rnd(0.3, 0.9),
        freq: rnd(0.3, 0.8),
        focus: chance(0.2) ? 0 : rnd(0.4, 1),
        warp: chance(0.5) ? 0 : rnd(0.05, 0.25),
        detail: rnd(0.4, 1),
      }
  }
}

/** New palette, form and composition. Frame size and grain stay as the user set them. */
export function randomAll(s: State): State {
  const scheme = weighted(SCHEMES.map((x) => [x, x.weight] as const))
  const colors = scheme.make()
  return { ...s, colors: colors.map(swatch), ...compose(weighted(scheme.fits), colors.length, s) }
}

/** New palette for the form on screen. Shapes are dealt its colours afresh; covers stay covers. */
export function randomColors(s: State): State {
  const colors = paletteFor(s.form)
  const blobs: Blob[] = []
  for (const b of s.blobs) blobs.push(isCover(b) ? b : { ...b, ...tint(colors.length, blobs) })
  return { ...s, colors: colors.map(swatch), blobs }
}

/** Same form and colours, new arrangement. */
export function randomLayout(s: State): State {
  return { ...s, ...compose(s.form, s.colors.length, s) }
}

/** Same shapes, shaken: each one moves, turns and breathes a little. Colours stay. */
export function shakeBlobs(s: State): State {
  return {
    ...s,
    seed: int(1, 65_535),
    blobs: s.blobs.map((b) => ({
      ...b,
      x: clamp(b.x + rnd(-0.1, 0.1), BLOB_RANGE.x),
      y: clamp(b.y + rnd(-0.1, 0.1), BLOB_RANGE.y),
      r: clamp(b.r * rnd(0.8, 1.25), BLOB_RANGE.r),
      a: turn(b.a + rnd(-0.7, 0.7)),
      st: clamp(b.st * rnd(0.75, 1.35), BLOB_RANGE.st),
      soft: clamp(b.soft + rnd(-0.15, 0.15), BLOB_RANGE.soft),
      edge: clamp(b.edge + rnd(-0.25, 0.25), BLOB_RANGE.edge),
    })),
  }
}

/** One shape cut and coloured anew, left where it is and as big as it was. */
export function rerollBlob(s: State, index: number): State {
  const others = s.blobs.filter((_, i) => i !== index)
  return {
    ...s,
    blobs: s.blobs.map((b, i) => (i === index ? { ...b, ...cut(b, s), ...tint(s.colors.length, others) } : b)),
  }
}
