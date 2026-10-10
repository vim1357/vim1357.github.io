import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { motion } from 'motion/react'
import { ThemeToggle } from '../components/ThemeToggle'
import { CONTROL } from '../components/TopControls'
import { shiftHue } from './color'
import {
  ArrowLeft,
  ColorList,
  Dice,
  Download,
  Flip,
  IconButton,
  Link,
  NumberField,
  Panel,
  Plus,
  Redo,
  Rows,
  Segmented,
  Shake,
  Slider,
  SwatchPick,
  Undo,
} from './controls'
import { placeBlob, randomAll, randomColors, randomLayout, rerollBlob, shakeBlobs } from './random'
import { Renderer, renderToBlob, type ExportType } from './renderer'
import { MAX_BLOBS, MAX_COLORS } from './shader'
import {
  BLOB_RANGE,
  DEFAULT_STATE,
  RANGE,
  STEP,
  decode,
  encode,
  swatch,
  type Blob,
  type Form,
  type NumKey,
  type State,
} from './state'

const pct = (v: number) => `${Math.round(v * 100)}%`
const times = (v: number) => `×${v.toFixed(2)}`

const FORM_OPTIONS: readonly { value: Form; label: string }[] = [
  { value: 'mesh', label: 'Меш' },
  { value: 'blobs', label: 'Фигуры' },
  { value: 'ribbon', label: 'Лента' },
  { value: 'folds', label: 'Складки' },
]

const SLIDERS: Record<
  Exclude<NumKey, 'w' | 'h' | 'seed' | 'cx' | 'cy'>,
  { label: string; format: (v: number) => string }
> = {
  scale: { label: 'Размер', format: pct },
  soft: { label: 'Мягкость', format: pct },
  angle: { label: 'Угол', format: (v) => `${Math.round(v)}°` },
  taper: { label: 'Раскрытие', format: pct },
  amp: { label: 'Амплитуда', format: pct },
  freq: { label: 'Частота', format: times },
  count: { label: 'Количество', format: (v) => String(Math.round(v)) },
  depth: { label: 'Объём', format: pct },
  stretch: { label: 'Вытянутость', format: times },
  focus: { label: 'Расфокус', format: pct },
  warp: { label: 'Искажение', format: pct },
  detail: { label: 'Детальность', format: times },
  grain: { label: 'Зерно', format: pct },
  grainSize: { label: 'Размер зерна', format: (v) => v.toFixed(1) },
}
type SliderKey = keyof typeof SLIDERS

/** Which shape sliders each form shows, and what it calls them when the general name is off. */
const FORM_SLIDERS: Record<Form, { keys: SliderKey[]; labels?: Partial<Record<SliderKey, string>> }> = {
  blobs: { keys: ['scale', 'focus'], labels: { scale: 'Общий размер' } },
  ribbon: {
    keys: ['scale', 'taper', 'soft', 'focus', 'amp', 'freq', 'angle'],
    labels: { scale: 'Ширина', soft: 'Мягкость края', amp: 'Изгиб' },
  },
  mesh: {
    keys: ['amp', 'depth', 'soft', 'focus', 'freq', 'stretch', 'angle', 'scale'],
    labels: { amp: 'Складки', soft: 'Мягкость сгиба', freq: 'Частота складок', scale: 'Размер пятен' },
  },
  folds: {
    keys: ['count', 'soft', 'focus', 'amp', 'freq', 'angle'],
    labels: { soft: 'Мягкость сгиба', amp: 'Изгиб' },
  },
}

/** Sliders of one shape. Its angle is kept in radians and shown in degrees. */
const BLOB_SLIDERS: readonly {
  key: keyof typeof BLOB_RANGE
  label: string
  step: number
  format: (v: number) => string
}[] = [
  { key: 'r', label: 'Размер', step: 0.01, format: pct },
  { key: 'st', label: 'Вытянутость', step: 0.05, format: times },
  { key: 'a', label: 'Поворот', step: Math.PI / 180, format: (v) => `${Math.round((v * 180) / Math.PI)}°` },
  { key: 'soft', label: 'Мягкость', step: 0.01, format: pct },
  { key: 'edge', label: 'Резкий край', step: 0.01, format: pct },
]

const SIZES = [
  { value: '1920x1080', label: '16:9' },
  { value: '1080x1920', label: '9:16' },
  { value: '1080x1080', label: '1:1' },
  { value: '1080x1350', label: '4:5' },
  { value: '1800x1200', label: '3:2' },
] as const

const FORMATS: readonly { value: ExportType; label: string }[] = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
]

const SCALES = [1, 2, 4].map((value) => ({ value, label: `${value}x` }))

/** Height reserved under the frame for its caption (16px line + 12px gap). */
const CAPTION = 28

/** The preview is the 1x image; only very large frames are previewed smaller. */
const previewScale = (s: State) => Math.min(1, 2560 / Math.max(s.w, s.h))

export default function App() {
  const [state, setState] = useState<State>(() => decode(location.hash.slice(1)) ?? DEFAULT_STATE)
  const [past, setPast] = useState<State[]>([])
  const [future, setFuture] = useState<State[]>([])
  const [format, setFormat] = useState<ExportType>('image/png')
  const [scale, setScale] = useState(2)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [unsupported, setUnsupported] = useState(false)
  // Which shape the panel is editing; picked by touching it on the canvas.
  const [picked, setPicked] = useState(0)

  const set = (patch: Partial<State>) => setState((s) => ({ ...s, ...patch }))

  /* ── Randomise, with a way back ─────────────────────────────── */

  const shuffle = (make: (s: State) => State) => {
    setPast((p) => [...p.slice(-49), state])
    setFuture([])
    setState(make(state))
  }
  const undo = () => {
    const prev = past.at(-1)
    if (!prev) return
    setPast(past.slice(0, -1))
    setFuture([state, ...future])
    setState(prev)
  }
  const redo = () => {
    const [next, ...rest] = future
    if (!next) return
    setPast([...past, state])
    setFuture(rest)
    setState(next)
  }

  // Space = another random one, unless a control has the key for itself.
  const shuffleRef = useRef(shuffle)
  shuffleRef.current = shuffle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.metaKey || e.ctrlKey || e.altKey) return
      if ((e.target as HTMLElement).closest?.('input, button, a, [role="slider"]')) return
      e.preventDefault()
      shuffleRef.current(randomAll)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /* ── Preview ────────────────────────────────────────────────── */

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderer = useRef<Renderer | null>(null)
  const latest = useRef(state)
  latest.current = state

  const paint = useCallback(() => {
    const r = renderer.current
    if (!r) return
    const s = latest.current
    const px = previewScale(s)
    const w = Math.round(s.w * px)
    const h = Math.round(s.h * px)
    if (r.canvas.width !== w) r.canvas.width = w
    if (r.canvas.height !== h) r.canvas.height = h
    r.draw(s, px)
  }, [])

  useEffect(() => {
    if (!renderer.current) {
      try {
        renderer.current = new Renderer(canvasRef.current!)
        renderer.current.onRestore = paint
      } catch {
        setUnsupported(true)
        return
      }
    }
    const id = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(id)
  }, [state, paint])

  // Keep the link in the address bar pointing at what is on screen.
  useEffect(() => {
    const id = window.setTimeout(() => history.replaceState(null, '', `#${encode(state)}`), 250)
    return () => window.clearTimeout(id)
  }, [state])

  // Fit the frame into the stage, whatever its aspect ratio.
  const stageRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const ro = new ResizeObserver(([entry]) =>
      setStage({ w: entry.contentRect.width, h: entry.contentRect.height }),
    )
    ro.observe(stageRef.current!)
    return () => ro.disconnect()
  }, [])
  // The caption sits right under the frame, so its line is taken out of the height.
  const fit = Math.max(0, Math.min(stage.w / state.w, (stage.h - CAPTION) / state.h))

  /* ── Dragging on the canvas: a blob, or the whole composition ── */

  const drag = useRef<{ x: number; y: number; blob: number } | null>(null)
  const framePoint = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }
  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = framePoint(e)
    let blob = -1
    if (state.form === 'blobs') {
      const dist = (i: number) =>
        Math.hypot((state.blobs[i].x - p.x) * state.w, (state.blobs[i].y - p.y) * state.h)
      state.blobs.forEach((_, i) => {
        if (blob < 0 || dist(i) < dist(blob)) blob = i
      })
    }
    if (blob >= 0) setPicked(blob)
    drag.current = { ...p, blob }
  }
  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current
    if (!d) return
    const p = framePoint(e)
    const dx = p.x - d.x
    const dy = p.y - d.y
    d.x = p.x
    d.y = p.y
    const blob = d.blob
    setState((s) =>
      s.form === 'blobs' && s.blobs[blob]
        ? { ...s, blobs: s.blobs.map((b, i) => (i === blob ? { ...b, x: b.x + dx, y: b.y + dy } : b)) }
        : { ...s, cx: s.cx + dx, cy: s.cy + dy },
    )
  }
  const onPointerEnd = () => {
    drag.current = null
  }

  /* ── Edits ──────────────────────────────────────────────────── */

  const setBlobCount = (n: number) => {
    const blobs = state.blobs.slice(0, n)
    while (blobs.length < n) blobs.push(placeBlob(blobs, state.colors.length, state))
    set({ blobs })
  }

  const blobIndex = Math.min(picked, state.blobs.length - 1)
  const blob = state.blobs[blobIndex]
  const setBlob = (patch: Partial<Blob>) =>
    set({ blobs: state.blobs.map((b, i) => (i === blobIndex ? { ...b, ...patch } : b)) })

  const addColor = () =>
    set({ colors: [...state.colors, swatch(shiftHue(state.colors[state.colors.length - 1].hex, 40))] })

  const outW = state.w * scale
  const outH = state.h * scale

  const download = async () => {
    setBusy(true)
    setNote(null)
    // Let the busy state paint before the render blocks the thread.
    await new Promise((resolve) => setTimeout(resolve, 30))
    try {
      const blob = await renderToBlob(state, scale, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gradient-${outW}x${outH}.${format === 'image/png' ? 'png' : 'jpg'}`
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch {
      setNote('Браузер не смог собрать файл такого размера — попробуй масштаб поменьше')
    } finally {
      setBusy(false)
    }
  }

  const copyLink = async () => {
    const url = `${location.origin}${location.pathname}#${encode(state)}`
    try {
      await navigator.clipboard.writeText(url)
      setNote('Ссылка на этот градиент скопирована')
    } catch {
      setNote('Не получилось скопировать — ссылка уже в адресной строке')
    }
    window.setTimeout(() => setNote(null), 2500)
  }

  const slider = (key: SliderKey, label = SLIDERS[key].label) => (
    <Slider
      key={key}
      label={label}
      value={state[key]}
      min={RANGE[key][0]}
      max={RANGE[key][1]}
      step={STEP[key] ?? 0.01}
      format={SLIDERS[key].format}
      onChange={(v) => set({ [key]: v })}
    />
  )

  const formSliders = FORM_SLIDERS[state.form]
  const sizeValue = `${state.w}x${state.h}`

  return (
    <div className="min-h-dvh bg-background text-primary lg:flex lg:h-dvh">
      <main className="sticky top-0 z-10 bg-background px-6 pb-2 pt-6 lg:static lg:order-2 lg:min-w-0 lg:flex-1 lg:py-8 lg:pl-2 lg:pr-8">
        {/* Phones: as tall as the frame needs at full width, capped so the controls stay in reach. */}
        <div
          ref={stageRef}
          style={{ '--frame-h': `calc((100vw - 3rem) * ${state.h / state.w} + ${CAPTION}px)` } as CSSProperties}
          className="relative h-[min(44svh,var(--frame-h))] lg:h-full"
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            {unsupported ? (
              <p className="max-w-[320px] text-center text-sm leading-5 text-muted">
                Этому браузеру не хватает WebGL2, без него градиент не нарисовать. Попробуй свежий
                Chrome, Safari или Firefox.
              </p>
            ) : (
              <>
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerEnd}
                  onPointerCancel={onPointerEnd}
                  style={{ width: Math.floor(state.w * fit), height: Math.floor(state.h * fit) }}
                  className="cursor-grab touch-none rounded-card active:cursor-grabbing"
                />
                <p className="text-center text-xs leading-4 text-muted">
                  {state.w} × {state.h} · {state.form === 'blobs' ? 'фигуры' : 'композицию'} можно двигать
                  прямо на холсте
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <aside className="flex flex-col lg:order-1 lg:h-dvh lg:w-[408px] lg:flex-none">
        <div className="flex flex-col gap-5 px-6 pb-4 pt-6 lg:pt-8">
          <div className="flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2 text-sm leading-5 text-muted transition-colors hover:text-primary"
            >
              <ArrowLeft />
              odokienko.ru
            </a>
            <ThemeToggle className={CONTROL} />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-bold leading-5 text-primary">Градиенты</h1>
            <p className="text-sm leading-5 text-muted">
              Конструктор зернистых градиентов: форма, цвета, шум. Пробел — следующий случайный.
            </p>
          </div>

          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={() => shuffle(randomAll)}
              whileTap={{ scale: 0.99 }}
              className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-btn bg-primary text-sm leading-5 text-background transition hover:brightness-90"
            >
              <Dice />
              Случайный
            </motion.button>
            <IconButton label="Назад" onClick={undo} disabled={!past.length}>
              <Undo />
            </IconButton>
            <IconButton label="Вперёд" onClick={redo} disabled={!future.length}>
              <Redo />
            </IconButton>
          </div>
        </div>

        <div className="flex flex-col gap-6 px-6 pb-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-color:var(--faint)_transparent] lg:[scrollbar-width:thin]">
          <Panel
            title="Форма"
            actions={
              <>
                {state.form === 'blobs' && (
                  <IconButton size="sm" label="Встряхнуть фигуры" onClick={() => shuffle(shakeBlobs)}>
                    <Shake />
                  </IconButton>
                )}
                <IconButton size="sm" label="Другая композиция" onClick={() => shuffle(randomLayout)}>
                  <Dice />
                </IconButton>
              </>
            }
          >
            <Segmented
              label="Форма"
              options={FORM_OPTIONS}
              value={state.form}
              onChange={(form) => set({ form })}
            />
            <Rows>
              {state.form === 'blobs' && (
                <Slider
                  label="Количество"
                  value={state.blobs.length}
                  min={1}
                  max={MAX_BLOBS}
                  step={1}
                  format={String}
                  onChange={setBlobCount}
                />
              )}
              {formSliders.keys.map((key) => slider(key, formSliders.labels?.[key]))}
            </Rows>
          </Panel>

          {state.form === 'blobs' && blob && (
            <Panel
              title="Фигура"
              actions={
                <IconButton size="sm" label="Другая фигура" onClick={() => shuffle((s) => rerollBlob(s, blobIndex))}>
                  <Dice />
                </IconButton>
              }
            >
              <Segmented
                label="Фигура"
                options={state.blobs.map((_, i) => ({ value: i, label: String(i + 1) }))}
                value={blobIndex}
                onChange={setPicked}
              />
              <Rows>
                {BLOB_SLIDERS.map(({ key, label, step, format }) => (
                  <Slider
                    key={key}
                    label={label}
                    value={blob[key]}
                    min={BLOB_RANGE[key][0]}
                    max={BLOB_RANGE[key][1]}
                    step={step}
                    format={format}
                    onChange={(v) => setBlob({ [key]: v })}
                  />
                ))}
                <SwatchPick
                  label="Цвет у края"
                  colors={state.colors}
                  value={blob.c1}
                  onChange={(c1) => setBlob({ c1 })}
                />
                <SwatchPick
                  label="Цвет в хвосте"
                  colors={state.colors}
                  value={blob.c2}
                  onChange={(c2) => setBlob({ c2 })}
                />
              </Rows>
            </Panel>
          )}

          <Panel
            title="Цвета"
            actions={
              <>
                <IconButton
                  size="sm"
                  label="Развернуть порядок"
                  onClick={() => set({ colors: [...state.colors].reverse() })}
                >
                  <Flip />
                </IconButton>
                <IconButton
                  size="sm"
                  label="Добавить цвет"
                  onClick={addColor}
                  disabled={state.colors.length >= MAX_COLORS}
                >
                  <Plus />
                </IconButton>
                <IconButton size="sm" label="Другая палитра" onClick={() => shuffle(randomColors)}>
                  <Dice />
                </IconButton>
              </>
            }
          >
            <ColorList colors={state.colors} min={2} onChange={(colors) => set({ colors })} />
          </Panel>

          <Panel title="Шум">
            <Rows>
              {slider('grain')}
              {slider('grainSize')}
              {slider('warp')}
              {slider('detail')}
            </Rows>
          </Panel>

          <Panel title="Размер">
            <Segmented
              label="Формат кадра"
              options={SIZES}
              value={SIZES.find((o) => o.value === sizeValue)?.value ?? null}
              onChange={(v) => {
                const [w, h] = v.split('x').map(Number)
                set({ w, h })
              }}
            />
            <div className="flex gap-0.5 overflow-hidden rounded-card">
              <NumberField label="Ш" value={state.w} min={RANGE.w[0]} max={RANGE.w[1]} onChange={(w) => set({ w })} />
              <NumberField label="В" value={state.h} min={RANGE.h[0]} max={RANGE.h[1]} onChange={(h) => set({ h })} />
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-2 border-t border-surface-2 px-6 pb-6 pt-4 lg:pb-8">
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <Segmented label="Формат файла" options={FORMATS} value={format} onChange={setFormat} />
            </div>
            <div className="min-w-0 flex-1">
              <Segmented label="Масштаб" options={SCALES} value={scale} onChange={setScale} />
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={download}
              disabled={busy || unsupported}
              whileTap={{ scale: 0.99 }}
              className="flex h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-btn bg-accent px-4 text-sm leading-5 text-white transition hover:brightness-95 disabled:opacity-60"
            >
              <span className="flex items-center gap-2">
                <Download />
                {busy ? 'Собираю…' : 'Скачать'}
              </span>
              <span className="tabular-nums opacity-70">
                {outW} × {outH}
              </span>
            </motion.button>
            <IconButton label="Скопировать ссылку на градиент" onClick={copyLink}>
              <Link />
            </IconButton>
          </div>
          {note && (
            <p role="status" className="text-xs leading-4 text-muted">
              {note}
            </p>
          )}
        </div>
      </aside>
    </div>
  )
}
