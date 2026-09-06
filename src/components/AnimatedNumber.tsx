import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'

// beui.dev/components/motion/number — ported to this project's stack
// (no @/lib/ease, no cn). Counts 0 → value once it scrolls into view.
const EASE_OUT = [0.22, 1, 0.36, 1] as const

export function AnimatedNumber({
  value,
  duration = 1.2,
  format = (n: number) => String(Math.round(n)),
  className,
}: {
  value: number
  duration?: number
  format?: (n: number) => string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    })
    return () => controls.stop()
  }, [value, duration, inView, reduce])

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ''}`}>
      {format(display)}
    </span>
  )
}
