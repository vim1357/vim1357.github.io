/** OKLab / OKLCH <-> sRGB. The shader blends in OKLab; palettes are built in OKLCH. */

export type Vec3 = [number, number, number]

const HEX_RE = /^#[0-9a-f]{6}$/

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const srgbToLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
const linearToSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

/** '#abc' / 'AABBCC' / '#aabbcc' → '#aabbcc', or null if it is not a colour. */
export function normalizeHex(input: string): string | null {
  let h = input.trim().toLowerCase()
  if (!h.startsWith('#')) h = `#${h}`
  if (/^#[0-9a-f]{3}$/.test(h)) h = `#${[...h.slice(1)].map((c) => c + c).join('')}`
  return HEX_RE.test(h) ? h : null
}

export function hexToOklab(hex: string): Vec3 {
  const n = parseInt(hex.slice(1), 16)
  const r = srgbToLinear(((n >> 16) & 255) / 255)
  const g = srgbToLinear(((n >> 8) & 255) / 255)
  const b = srgbToLinear((n & 255) / 255)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToLinear(L: number, a: number, b: number): Vec3 {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/**
 * OKLCH → hex. Out-of-gamut colours keep their lightness and hue and give up
 * chroma, so a request for an impossible "very light, very saturated blue"
 * lands on the most saturated blue that exists at that lightness.
 */
export function oklch(l: number, c: number, h: number): string {
  const rad = (h * Math.PI) / 180
  const at = (ch: number) => oklabToLinear(l, ch * Math.cos(rad), ch * Math.sin(rad))
  const inGamut = (rgb: Vec3) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)
  let chroma = c
  if (!inGamut(at(c))) {
    let lo = 0
    let hi = c
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      if (inGamut(at(mid))) lo = mid
      else hi = mid
    }
    chroma = lo
  }
  const hex = at(chroma).map((v) =>
    Math.round(clamp01(linearToSrgb(clamp01(v))) * 255)
      .toString(16)
      .padStart(2, '0'),
  )
  return `#${hex.join('')}`
}

/** Same lightness and chroma, hue moved by `deg`. */
export function shiftHue(hex: string, deg: number): string {
  const [l, a, b] = hexToOklab(hex)
  return oklch(l, Math.hypot(a, b), (Math.atan2(b, a) * 180) / Math.PI + deg)
}
