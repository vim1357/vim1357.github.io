import { useEffect, useRef, useState } from 'react'
import { profile } from '../data/profile'
import { getViews, hitViews } from '../lib/counter'

type Mode = 'idle' | 'playing' | 'paused' | 'ended'

function fmt(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

const pill =
  'flex items-center rounded-badge border border-white/10 bg-black/40 px-2 py-1 text-xs leading-none text-white backdrop-blur-md'

function Glyph({ mode }: { mode: Mode }) {
  const cls = 'h-6 w-6 text-white drop-shadow'
  if (mode === 'playing')
    return (
      <svg viewBox="0 0 24 24" className={cls} aria-hidden>
        <rect x="7" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
        <rect x="13.5" y="5" width="3.5" height="14" rx="1" fill="currentColor" />
      </svg>
    )
  if (mode === 'ended')
    return (
      <svg viewBox="0 0 24 24" className={cls} fill="none" aria-hidden>
        <path
          d="M20 12a8 8 0 1 1-2.3-5.6M20 4v3.5h-3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  // idle / paused → play
  return (
    <svg viewBox="0 0 24 24" className={cls} aria-hidden>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  )
}

/**
 * Circular avatar video player.
 * idle: muted loop, timer shows full length (static). hover → dim + play.
 * click: restart with sound, timer counts down, +1 view. hover → dim + pause.
 * pause/resume on further clicks (not counted). ended: dim + replay at 0:00.
 * Falls back to poster + play if muted autoplay is blocked.
 */
export function AvatarPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [remaining, setRemaining] = useState(0)
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    let alive = true
    getViews().then((v) => alive && v != null && setViews(v))
    const el = videoRef.current
    if (el) {
      // idle ambient state — controlled imperatively so re-renders can't reset them
      el.muted = true
      el.loop = true
      el.play().catch(() => {}) // muted autoplay; ignored if blocked
    }
    return () => {
      alive = false
    }
  }, [])

  const onLoaded = () => {
    const v = videoRef.current
    if (v) setRemaining(v.duration)
  }
  const onTime = () => {
    const v = videoRef.current
    if (v && (mode === 'playing' || mode === 'paused')) {
      setRemaining(Math.max(0, v.duration - v.currentTime))
    }
  }
  const onEnded = () => {
    setMode('ended')
    setRemaining(0)
  }

  const startWithSound = () => {
    const v = videoRef.current
    if (!v) return
    v.loop = false
    v.muted = false
    v.currentTime = 0
    v.play().catch(() => {})
    setMode('playing')
    hitViews().then((n) => n != null && setViews(n))
  }

  const handleClick = () => {
    const v = videoRef.current
    if (!v) return
    if (mode === 'idle' || mode === 'ended') startWithSound()
    else if (mode === 'playing') {
      v.pause()
      setMode('paused')
    } else {
      v.play().catch(() => {})
      setMode('playing')
    }
  }

  const persistent = mode === 'paused' || mode === 'ended'
  const label =
    mode === 'playing' ? 'Пауза' : mode === 'ended' ? 'Смотреть заново' : 'Смотреть со звуком'

  return (
    <div className="relative h-[120px] w-[120px]">
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-full bg-surface"
      >
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={profile.avatar.video}
          poster={profile.avatar.poster}
          playsInline
          preload="metadata"
          onLoadedMetadata={onLoaded}
          onTimeUpdate={onTime}
          onEnded={onEnded}
        />
        <span
          className={`absolute inset-0 grid place-items-center rounded-full bg-black/35 transition-opacity duration-200 ${
            persistent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Glyph mode={mode} />
        </span>
      </button>

      <div className="pointer-events-none absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5">
        <span className={`${pill} w-12 justify-center tabular-nums`}>{fmt(remaining)}</span>
        <span className={pill} title="Просмотры">
          <svg viewBox="0 0 24 24" className="mr-1 h-3.5 w-3.5" fill="none" aria-hidden>
            <path
              d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="2" />
          </svg>
          {views ?? 0}
        </span>
      </div>
    </div>
  )
}
