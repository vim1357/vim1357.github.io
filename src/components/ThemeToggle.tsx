import type { MouseEvent } from 'react'
import { useTheme } from '../lib/theme'

// beui.dev/components/motion/theme-toggle — "Circle blur" variant, ported to
// this project's own [data-theme] system (no next-themes / lucide). The reveal
// circle expands from the toggle button itself via the View Transitions API.

const STYLE_ID = 'beui-circle-blur-style'
const VT_CSS = `
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }
html[data-beui-vt="circle-blur"]::view-transition-old(root) { z-index: 1; }
html[data-beui-vt="circle-blur"]::view-transition-new(root) {
  z-index: 2;
  animation: beui-circle-blur-reveal 700ms cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes beui-circle-blur-reveal {
  from { clip-path: circle(0% at var(--beui-vt-origin, 50% 50%)); filter: blur(8px); }
  to { clip-path: circle(150% at var(--beui-vt-origin, 50% 50%)); filter: blur(0px); }
}
`

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return
  const s = document.createElement('style')
  s.id = STYLE_ID
  s.textContent = VT_CSS
  document.head.appendChild(s)
}

type ViewTransitionDoc = Document & {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> }
}

function Sun() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Moon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
      <path
        d="M20 13.4A8 8 0 1 1 10.6 4a6.5 6.5 0 0 0 9.4 9.4z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? 'light' : 'dark'
    const root = document.documentElement

    // Circle origin = the toggle button's center, as % of the viewport.
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = ((rect.left + rect.width / 2) / window.innerWidth) * 100
    const cy = ((rect.top + rect.height / 2) / window.innerHeight) * 100
    root.style.setProperty('--beui-vt-origin', `${cx}% ${cy}%`)

    const doc = document as ViewTransitionDoc
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce || typeof doc.startViewTransition !== 'function') {
      setTheme(next)
      return
    }

    ensureStyle()
    root.setAttribute('data-beui-vt', 'circle-blur')
    const vt = doc.startViewTransition(() => setTheme(next))
    vt.finished.finally(() => root.removeAttribute('data-beui-vt'))
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className={className}
    >
      {isDark ? <Moon /> : <Sun />}
    </button>
  )
}
