import { hexToOklab } from './color'
import { FRAG, MAX_BLOBS, MAX_COLORS, VERT } from './shader'
import { FORMS, type State } from './state'

const UNIFORMS = [
  'uRes', 'uTile', 'uForm', 'uN', 'uCol', 'uBlobN', 'uBlob', 'uCenter', 'uOff', 'uPhase',
  'uScale', 'uSoft', 'uWarp', 'uDetail', 'uAngle', 'uCurve', 'uAmp', 'uFreq', 'uRays',
  'uStretch', 'uGrain', 'uGrainSize', 'uGrainOct',
] as const

const RAD = Math.PI / 180

/** Small seeded PRNG so one `seed` number always gives the same noise offsets. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class Renderer {
  readonly canvas: HTMLCanvasElement
  /** Called after the GPU context was lost and rebuilt — the caller should draw again. */
  onRestore?: () => void
  private gl: WebGL2RenderingContext
  private u = {} as Record<(typeof UNIFORMS)[number], WebGLUniformLocation | null>

  constructor(canvas: HTMLCanvasElement, preserveDrawingBuffer = false) {
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer })
    if (!gl) throw new Error('WebGL2 is not available')
    this.canvas = canvas
    this.gl = gl
    this.init()
    canvas.addEventListener('webglcontextlost', (e) => e.preventDefault())
    canvas.addEventListener('webglcontextrestored', () => {
      this.init()
      this.onRestore?.()
    })
  }

  /** Largest canvas side this GPU can render in one go. */
  get maxSize(): number {
    const gl = this.gl
    return Math.min(gl.getParameter(gl.MAX_RENDERBUFFER_SIZE), ...gl.getParameter(gl.MAX_VIEWPORT_DIMS))
  }

  private init() {
    const gl = this.gl
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) ?? 'Shader failed to compile')
      }
      return shader
    }
    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Program failed to link')
    }
    gl.useProgram(program)
    gl.bindVertexArray(gl.createVertexArray())
    for (const name of UNIFORMS) this.u[name] = gl.getUniformLocation(program, name)
  }

  /**
   * Draw `s` into the canvas at its current size. `px` is output pixels per
   * design pixel; `tileX/tileY` is where this canvas sits inside the full
   * output image, so a large export can be rendered piece by piece.
   */
  draw(s: State, px = 1, tileX = 0, tileY = 0) {
    const { gl, u, canvas } = this
    const short = Math.min(s.w, s.h)
    // Frame fractions → shader space (centred, short side = 1).
    const toP = (x: number, y: number) => [((x - 0.5) * s.w) / short, ((y - 0.5) * s.h) / short]

    const colors = s.colors.slice(0, MAX_COLORS)
    const col = new Float32Array(MAX_COLORS * 3)
    colors.forEach((c, i) => col.set(hexToOklab(c.hex), i * 3))

    const blobs = s.blobs.slice(0, MAX_BLOBS)
    const blob = new Float32Array(MAX_BLOBS * 4)
    blobs.forEach((b, i) => blob.set([...toP(b.x, b.y), b.r, b.a + s.angle * RAD], i * 4))

    const rand = mulberry32(s.seed)

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.uRes, s.w, s.h)
    gl.uniform4f(u.uTile, tileX, tileY, px, canvas.height)
    gl.uniform1i(u.uForm, FORMS.indexOf(s.form))
    gl.uniform1i(u.uN, colors.length)
    gl.uniform3fv(u.uCol, col)
    gl.uniform1i(u.uBlobN, blobs.length)
    gl.uniform4fv(u.uBlob, blob)
    gl.uniform2fv(u.uCenter, toP(s.cx, s.cy))
    gl.uniform2f(u.uOff, rand() * 100, rand() * 100)
    gl.uniform1f(u.uPhase, rand() * Math.PI * 2)
    gl.uniform1f(u.uScale, s.scale)
    gl.uniform1f(u.uSoft, s.soft)
    gl.uniform1f(u.uWarp, s.warp)
    gl.uniform1f(u.uDetail, s.detail)
    gl.uniform1f(u.uAngle, s.angle * RAD)
    gl.uniform1f(u.uCurve, s.curve)
    gl.uniform1f(u.uAmp, s.amp)
    gl.uniform1f(u.uFreq, s.freq)
    gl.uniform1f(u.uRays, Math.round(s.rays))
    gl.uniform1f(u.uStretch, s.stretch)
    gl.uniform1f(u.uGrain, s.grain)
    // Slider 0..2 → grain cell of 1..4 design px; nothing finer than a pixel exists.
    gl.uniform1f(u.uGrainSize, 1 + s.grainSize * 1.5)
    gl.uniform1i(u.uGrainOct, 1 + Math.max(0, Math.round(Math.log2(px))))
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  /** Release the GPU context. Only for throwaway canvases — a lost context never comes back to its canvas. */
  dispose() {
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}

export type ExportType = 'image/png' | 'image/jpeg'

/**
 * Render `s` at `scale`x into an image file. Drawn in tiles on a throwaway GL
 * canvas and stitched on a 2D one, so a 4x export does not depend on the GPU
 * accepting one enormous framebuffer.
 */
export async function renderToBlob(s: State, scale: number, type: ExportType): Promise<Blob> {
  const W = Math.round(s.w * scale)
  const H = Math.round(s.h * scale)
  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  if (!ctx) throw new Error('2D canvas is not available')

  const glCanvas = document.createElement('canvas')
  const renderer = new Renderer(glCanvas, true)
  try {
    const tile = Math.min(2048, renderer.maxSize)
    for (let y = 0; y < H; y += tile) {
      for (let x = 0; x < W; x += tile) {
        glCanvas.width = Math.min(tile, W - x)
        glCanvas.height = Math.min(tile, H - y)
        renderer.draw(s, scale, x, y)
        ctx.drawImage(glCanvas, x, y)
      }
    }
  } finally {
    renderer.dispose()
  }

  return new Promise((resolve, reject) => {
    out.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image is too large to encode'))),
      type,
      0.95,
    )
  })
}
